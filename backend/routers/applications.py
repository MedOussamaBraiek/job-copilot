import os
import json
from io import BytesIO
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException  
import pdfplumber
from langchain_groq import ChatGroq
from tavily import TavilyClient
from agents import compiled_supervisor
from typing import List

from services.database import get_db
from services.models import Application as ApplicationDB
from models import ApplicationResponse, AnalysisResult, SaveApplicationRequest, RegenerateRequest, RegeneratedContent
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from services.email_service import send_application_email

llm = ChatGroq(model="openai/gpt-oss-120b")
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

router = APIRouter(prefix="/api/applications", tags=["applications"])

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
async def analyze(file: UploadFile = File(...), job_url: str = Form(...)):
    cv_text = await extract_pdf_text(file)
    job_posting_results = tavily.search(job_url)

    if not job_posting_results["results"]:
        raise HTTPException(status_code=404, detail="No job posting found for this URL")
    
    job_posting = job_posting_results["results"][0]["content"]

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
        
        # Stream progress events
        for event in compiled_supervisor.stream(initial_state):
            for node_name, updates in event.items():
                step_name = step_names.get(node_name, node_name)
                yield f"data: {json.dumps({'step': step_name, 'status': 'in_progress'})}\n\n"
        
        # Get final result
        result = compiled_supervisor.invoke(initial_state)
        
        print(f"DEBUG Final result: {result}")
        
        # Send final result
        final_data = {
            "status": "complete",
            "cv_text": cv_text,
            "job_posting": job_posting,
            "match_score": result["match_score"],
            "gaps": result["gaps"],
            "strengths": result["strengths"],
            "cover_letter": result["cover_letter"],
            "draft_email": result["draft_email"],
            "feedback": result["feedback"]
        }
        print(f"DEBUG Sending: {final_data}")
        yield f"data: {json.dumps(final_data)}\n\n"

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
    data: SaveApplicationRequest,  # Pydantic — API input
    db: Session = Depends(get_db)  # Database session
) -> ApplicationResponse:  # Pydantic — API output
    
    # Create SQLAlchemy model from Pydantic
    app = ApplicationDB(
        cv_text=data.cv_text,
        company_url=data.company_url,
        match_score=data.match_score,
        cover_letter=data.cover_letter,
        draft_email=data.draft_email,
        feedback=data.feedback
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
    hiring_manager_email: str,
    hiring_manager_name: str = "Hiring Manager",
    db: Session = Depends(get_db)
):
    """Send application email with cover letter and CV"""
    
    app = db.query(ApplicationDB).filter(ApplicationDB.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    success = send_application_email(
        to_email=hiring_manager_email,
        hiring_manager_name=hiring_manager_name,
        cover_letter=app.cover_letter,
        cv_text=app.cv_text,
        job_title="Job Application"
    )
    
    if success:
        app.status = "sent"  
        db.commit()
        return {"status": "success", "message": f"Email sent to {hiring_manager_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")