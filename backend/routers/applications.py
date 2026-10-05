import os
from io import BytesIO
from fastapi import APIRouter, File, UploadFile, Form
from models import AnalyzeRequest, AnalysisResult, Application
import pdfplumber
from langchain_groq import ChatGroq
from tavily import TavilyClient
from agents import compiled_supervisor

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
    print(f"{'=' * 30}")
    print(job_posting_results)
    print(f"{'=' * 30}")

    if not job_posting_results["results"]:
        return {"error": "No job posting found for this URL"}
    
    job_posting = job_posting_results["results"][0]["content"]

    result = compiled_supervisor.invoke({"cv_text": cv_text, "job_posting": job_posting})
    return result

@router.post("/")
async def save_application(app: Application):
    # TODO: Save to database
    pass

@router.get("/")
async def get_applications():
    # TODO: Get from database
    pass