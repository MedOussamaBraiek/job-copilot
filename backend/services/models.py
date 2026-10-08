from sqlalchemy import Column, String, Integer, DateTime, LargeBinary
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Application(Base):  # SQLAlchemy model
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    cv_text = Column(String)
    company_url = Column(String)
    company_name = Column(String, nullable=True)
    match_score = Column(Integer)
    cover_letter = Column(String)
    draft_email = Column(String)
    feedback = Column(String, nullable=True)
    status = Column(String, default="pending")
    hiring_email = Column(String, nullable=True)
    cv_pdf = Column(LargeBinary, nullable=True)
    job_posting = Column(String, nullable=True)
    tailored_cv = Column(String, nullable=True)
    gaps = Column(String, nullable=True)
    strengths = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
