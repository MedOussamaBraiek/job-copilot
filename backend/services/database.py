import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.models import Base

load_dotenv("./.env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///job_copilot.db")

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)  # create tables on startup
Session = sessionmaker(bind=engine)

def get_db():
    """FastAPI dependency to get a database session"""
    db = Session()
    try:
        yield db  # Give session to the endpoint
    finally:
        db.close()  # Clean up after endpoint finishes