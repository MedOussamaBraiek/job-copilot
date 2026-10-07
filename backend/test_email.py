from services.database import Session
from services.models import Application as ApplicationDB
from services.email_service import send_application_email

db = Session()

# Create test application
test_app = ApplicationDB(
    cv_text="Mohamed Oussama Braiek\nAI Engineer\nSkills: Python, React, FastAPI",
    company_url="https://example.com/job",
    match_score=85,
    cover_letter="Dear Hiring Manager,\n\nI am excited to apply for this position.",
    draft_email="Subject: Application\n\nHi, Please find my CV attached.",
    feedback="Great match!",
    status="pending"
)
db.add(test_app)
db.commit()
db.refresh(test_app)

print(f"Test app created: ID {test_app.id}")

# TEST EMAIL - replace with YOUR email
success = send_application_email(
    to_email="your-email@gmail.com",
    hiring_manager_name="John Smith",
    cover_letter=test_app.cover_letter,
    cv_text=test_app.cv_text,
    job_title="Software Engineer"
)

print(f"Email sent: {success}")
db.close()