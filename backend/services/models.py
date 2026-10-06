from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Application(Base):  # SQLAlchemy model
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True)
    cv_text = Column(String)
    company_url = Column(String)
    match_score = Column(Integer)
    cover_letter = Column(String)
    draft_email = Column(String)
    feedback = Column(String)
    created_at = Column(DateTime, default=datetime.now)