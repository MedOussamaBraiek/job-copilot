import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
from xml.sax.saxutils import escape

from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate

load_dotenv("./.env")


PDF_CHAR_MAP = str.maketrans({"‐": "-", "‑": "-", "‒": "-"})


def text_to_pdf(text: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    style = ParagraphStyle("Body", parent=getSampleStyleSheet()["Normal"], fontSize=11, leading=14)
    cleaned = escape(text.translate(PDF_CHAR_MAP))
    doc.build([Paragraph(cleaned.replace("\n", "<br/>"), style)])
    buffer.seek(0)
    return buffer


def split_subject(draft: str, default_subject: str) -> tuple[str, str]:
    first, _, rest = draft.partition("\n")
    if first.lower().startswith("subject:"):
        return first[len("subject:"):].strip(), rest.strip()
    return default_subject, draft.strip()


def attach_pdf(data: bytes, filename: str) -> MIMEApplication:
    part = MIMEApplication(data, _subtype="pdf")
    part.add_header("Content-Disposition", "attachment", filename=filename)
    return part


def send_application_email(
    to_email: str,
    draft_email: str,
    cover_letter: str,
    cv_pdf: bytes,
    job_title: str,
) -> bool:
    try:
        sender_email = os.getenv("GMAIL_EMAIL")
        sender_password = os.getenv("GMAIL_PASSWORD")
        subject, body = split_subject(draft_email, f"Application for {job_title}")

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))
        msg.attach(attach_pdf(text_to_pdf(cover_letter).getvalue(), "cover_letter.pdf"))
        msg.attach(attach_pdf(cv_pdf, "cv.pdf"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False
