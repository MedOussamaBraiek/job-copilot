import os
from io import BytesIO
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException  
import pdfplumber
from langchain_groq import ChatGroq
from tavily import TavilyClient
from agents import compiled_supervisor
from typing import List

from services.database import get_db
from services.models import Application as ApplicationDB
from models import ApplicationResponse, AnalysisResult, SaveApplicationRequest
from sqlalchemy.orm import Session

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
async def analyze(file: UploadFile = File(...), job_url: str = Form(...)) -> AnalysisResult:
    cv_text = await extract_pdf_text(file)
    job_posting_results = tavily.search(job_url)

    if not job_posting_results["results"]:
        raise HTTPException(status_code=404, detail="No job posting found for this URL")
    
    job_posting = job_posting_results["results"][0]["content"]

    result = compiled_supervisor.invoke({"cv_text": cv_text, "job_posting": job_posting})
    return result

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

@router.get("/")
async def get_applications(db: Session = Depends(get_db)) -> List[ApplicationResponse]:
    result = db.query(ApplicationDB).all()  
    return [ApplicationResponse.from_orm(app) for app in result]  