from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    cv_text: str
    job_posting: str


class AnalysisResult(BaseModel):
    match_score: int
    gaps: List[str]
    strengths: List[str]
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None


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
    gaps: List[str]
    strengths: List[str]
    cover_letter: str
    draft_email: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows .from_orm() conversion