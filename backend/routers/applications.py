import os
import json
import base64
from io import BytesIO
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, Response
import pdfplumber
from langchain_groq import ChatGroq
from tavily import TavilyClient
from agents import compiled_supervisor
from typing import List

from services.database import get_db
from services.models import Application as ApplicationDB
from services.email_service import send_application_email, text_to_pdf
from services.cv_pdf import tailored_cv_to_pdf
from services.job_utils import find_hiring_email, guess_company_name
from models import ApplicationResponse, AnalysisResult, SaveApplicationRequest, RegenerateRequest, RegeneratedContent, TailoredCV, UpdateStatusRequest, UpdateCompanyRequest
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

llm = ChatGroq(model="openai/gpt-oss-120b")
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

router = APIRouter(prefix="/api/applications", tags=["applications"])


def tailored_pdf(raw: str) -> bytes:
    try:
        return tailored_cv_to_pdf(TailoredCV.model_validate_json(raw)).getvalue()
    except ValueError:
        return text_to_pdf(raw).getvalue()

async def extract_pdf_text(file: UploadFile):
    contents = await file.read()
    pdf_file = BytesIO(contents)

    documents = []
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                documents.append(text)

    cv_text = "\n".join(documents)
    return cv_text

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    job_url: str = Form(""),
    job_description: str = Form(""),
    company_name_input: str = Form(""),
):
    cv_text = await extract_pdf_text(file)
    raw_page = ""
    title = ""

    if job_description.strip():
        job_posting = job_description.strip()
        raw_page = job_posting
    else:
        if not job_url.strip():
            raise HTTPException(status_code=400, detail="Paste a job description or a job URL")
        job_posting_results = tavily.search(job_url, include_raw_content=True)
        if not job_posting_results["results"]:
            raise HTTPException(status_code=404, detail="No job posting found for this URL")
        top = job_posting_results["results"][0]
        job_posting = top["content"]
        raw_page = top.get("raw_content") or ""
        title = top.get("title", "")

    company_name = company_name_input.strip() or guess_company_name(title)
    hiring_email = find_hiring_email(raw_page) or find_hiring_email(job_posting)

    step_names = {
        "parser": "Parsing CV",
        "scorer": "Scoring Match",
        "writer": "Generating Letter",
        "low_match": "Processing Results"
    }

    def event_generator():
        initial_state = {
            "cv_text": cv_text,
            "job_posting": job_posting,
            "match_score": 0,
            "gaps": [],
            "strengths": [],
            "cover_letter": "",
            "draft_email": "",
            "feedback": "",
            "human_approved": False
        }
        state = dict(initial_state)

        try:
            for event in compiled_supervisor.stream(initial_state):
                for node_name, updates in event.items():
                    state.update(updates)
                    step = step_names.get(node_name, node_name)
                    yield f"data: {json.dumps({'step': step, 'status': 'in_progress'})}\n\n"

            final_data = {
                "status": "complete",
                "cv_text": cv_text,
                "job_posting": job_posting,
                "match_score": state["match_score"],
                "gaps": state["gaps"],
                "strengths": state["strengths"],
                "cover_letter": state["cover_letter"],
                "draft_email": state["draft_email"],
                "feedback": state["feedback"],
                "company_name": company_name,
                "hiring_email": hiring_email,
            }
            yield f"data: {json.dumps(final_data)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)[:200]})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/regenerate")
async def regenerate(request: RegenerateRequest) -> RegeneratedContent:
    prompt = f"""
    CV: {request.cv_text}
    Job: {request.job_posting}

    Current Cover Letter: {request.cover_letter}
    Current Draft Email: {request.draft_email}
    User Feedback: {request.user_feedback}

    Improve the cover letter and draft email based on the feedback.
    Return ONLY a JSON object with: {{"cover_letter": "...", "draft_email": "..."}}
    """

    result = llm.invoke(prompt).content
    data = json.loads(result)

    return RegeneratedContent(
        cover_letter=data["cover_letter"],
        draft_email=data["draft_email"]
    )


@router.get("/")
async def get_applications(db: Session = Depends(get_db)) -> List[ApplicationResponse]:
    result = db.query(ApplicationDB).all()
    return [ApplicationResponse.from_orm(app) for app in result]


@router.get("/{application_id}")
async def get_application(application_id: int, db: Session = Depends(get_db)) -> ApplicationResponse:
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.from_orm(app)

@router.post("/")
async def save_application(
    data: SaveApplicationRequest,
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    app = ApplicationDB(
        cv_text=data.cv_text,
        company_url=data.company_url,
        company_name=data.company_name,
        match_score=data.match_score,
        cover_letter=data.cover_letter,
        draft_email=data.draft_email,
        feedback=data.feedback,
        hiring_email=data.hiring_email,
        cv_pdf=base64.b64decode(data.cv_pdf_base64) if data.cv_pdf_base64 else None,
        job_posting=data.job_posting,
        gaps=json.dumps(data.gaps) if data.gaps else None,
        strengths=json.dumps(data.strengths) if data.strengths else None,
    )

    db.add(app)
    db.commit()
    db.refresh(app)

    return ApplicationResponse.from_orm(app)


@router.delete("/{application_id}")
async def delete_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()
    return {"message": "Deleted"}


@router.post("/{application_id}/send-email")
async def send_application_email_endpoint(
    application_id: int,
    hiring_manager_email: str = Form(...),
    cv_source: str = Form("saved"),
    db: Session = Depends(get_db)
):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if cv_source == "tailored":
        if not app.tailored_cv:
            raise HTTPException(status_code=400, detail="Generate the tailored CV first")
        cv_pdf = tailored_pdf(app.tailored_cv)
    else:
        cv_pdf = app.cv_pdf or text_to_pdf(app.cv_text).getvalue()

    success = send_application_email(
        to_email=hiring_manager_email,
        draft_email=app.draft_email,
        cover_letter=app.cover_letter,
        cv_pdf=cv_pdf,
        job_title=app.company_name or "Job Application"
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    app.status = "emailed"
    db.commit()
    return {"status": "success", "message": f"Email sent to {hiring_manager_email}"}


@router.get("/{application_id}/cv.pdf")
async def download_cv(application_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return Response(
        content=app.cv_pdf or text_to_pdf(app.cv_text).getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="cv.pdf"'},
    )


@router.get("/{application_id}/cover-letter.pdf")
async def download_cover_letter(application_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return Response(
        content=text_to_pdf(app.cover_letter).getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="cover_letter.pdf"'},
    )


@router.patch("/{application_id}/status")
async def update_status(
    application_id: int,
    data: UpdateStatusRequest,
    db: Session = Depends(get_db)
):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = data.status
    db.commit()
    return {"status": app.status}


@router.patch("/{application_id}/company")
async def update_company(
    application_id: int,
    data: UpdateCompanyRequest,
    db: Session = Depends(get_db)
):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.company_name = data.company_name.strip() or None
    db.commit()
    return {"company_name": app.company_name}


@router.post("/{application_id}/tailor-cv")
async def tailor_cv(application_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    gaps = json.loads(app.gaps) if app.gaps else []
    strengths = json.loads(app.strengths) if app.strengths else []
    if not (gaps or strengths or app.feedback):
        raise HTTPException(status_code=400, detail="No analysis saved for this application")

    prompt = f"""
    You are tailoring a CV for a specific job. Rewrite the CV so it better matches the job posting.

    Rules:
    - Use only facts that already appear in the CV. Never add experience, skills, employers, dates, certifications or metrics that are not in the CV.
    - You may reorder sections and bullet points, reword sentences, and move the most relevant skills and experience to the top.
    - Keep the same name, contact details and education. Include the projects from the CV, most relevant first.
    - Return JSON only, no markdown, no commentary. Keep bullets short.

    CV:
    {app.cv_text}

    Gaps for this job (the candidate should show these areas where they have relevant experience):
    {gaps}

    Strengths to highlight for this job:
    {strengths}

    Advice for this application:
    {app.feedback}

    Return ONLY JSON in this shape (use empty strings or empty lists when unknown):
    {{"name": "", "headline": "", "email": "", "phone": "", "location": "", "summary": "", "skills": [""], "experience": [{{"title": "", "company": "", "period": "", "bullets": [""]}}], "education": [{{"degree": "", "school": "", "period": ""}}], "certificates": [""], "languages": [""], "projects": [{{"name": "", "description": "", "tech": [""], "link": ""}}]}}
    Copy the name, email, phone and location exactly from the CV.
    """

    raw = llm.invoke(prompt).content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    tailored = TailoredCV.model_validate(json.loads(raw))
    app.tailored_cv = tailored.model_dump_json()
    db.commit()
    return {"tailored_cv": tailored.model_dump()}


@router.get("/{application_id}/tailored-cv.pdf")
async def download_tailored_cv(application_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app or not app.tailored_cv:
        raise HTTPException(status_code=404, detail="No tailored CV yet")
    return Response(
        content=tailored_pdf(app.tailored_cv),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="tailored_cv.pdf"'},
    )
