from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.models import Base

engine = create_engine("sqlite:///job_copilot.db") # SQLite file-based DB
Base.metadata.create_all(engine)  # Create tables on startup
Session = sessionmaker(bind=engine)

def get_db():
    """FastAPI dependency to get a database session"""
    db = Session()
    try:
        yield db  # Give session to the endpoint
    finally:
        db.close()  # Clean up after endpoint finishes