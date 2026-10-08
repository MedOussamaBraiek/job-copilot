from pydantic import BaseModel
from typing import List, Optional, Literal
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
    company_name: Optional[str] = None
    hiring_email: Optional[str] = None
    cv_pdf_base64: Optional[str] = None
    job_posting: Optional[str] = None
    gaps: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    match_score: int
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    cv_text: str
    company_url: str
    company_name: Optional[str] = None
    hiring_email: Optional[str] = None
    status: str
    tailored_cv: Optional[str] = None
    match_score: int
    cover_letter: str
    draft_email: str
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True  # Allows .from_orm() conversion


class UpdateCompanyRequest(BaseModel):
    company_name: str

class TailoredExperience(BaseModel):
    title: str = ""
    company: str = ""
    period: str = ""
    bullets: List[str] = []

class TailoredEducation(BaseModel):
    degree: str = ""
    school: str = ""
    period: str = ""

class TailoredProject(BaseModel):
    name: str = ""
    description: str = ""
    tech: List[str] = []
    link: str = ""

class TailoredCV(BaseModel):
    name: str
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    skills: List[str] = []
    experience: List[TailoredExperience] = []
    education: List[TailoredEducation] = []
    certificates: List[str] = []
    languages: List[str] = []
    projects: List[TailoredProject] = []

class UpdateStatusRequest(BaseModel):
    status: Literal["pending", "applied", "emailed"]
