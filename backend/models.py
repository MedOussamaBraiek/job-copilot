from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    cv_text: str
    job_posting: str


class AnalysisResult(BaseModel):
    cv_text: str  
    job_posting: str
    match_score: int
    gaps: List[str]
    strengths: List[str]
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None

class RegeneratedContent(BaseModel):
    cover_letter: str
    draft_email: str

class RegenerateRequest(BaseModel):
    cv_text: str
    job_posting: str
    user_feedback: str
    cover_letter: str
    draft_email: str

class SaveApplicationRequest(BaseModel):
    cv_text: str
    company_url: str
    match_score: int
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None
    

class ApplicationResponse(BaseModel):
    id: int
    cv_text: str
    company_url: str
    match_score: int
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True  # Allows .from_orm() conversion