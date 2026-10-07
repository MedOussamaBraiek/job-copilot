import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.application import MIMEApplication
from email import encoders
import os
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_cover_letter_pdf(cover_letter_text: str) -> BytesIO:
    """Generate PDF from cover letter text"""
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    
    styles = getSampleStyleSheet()
    custom_style = ParagraphStyle(
        'Custom',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
    )
    
    story = [Paragraph(cover_letter_text.replace('\n', '<br/>'), custom_style)]
    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer

def send_application_email(
    to_email: str,
    hiring_manager_name: str,
    cover_letter: str,
    cv_text: str,
    job_title: str
) -> bool:
    """Send application email with cover letter and CV"""
    try:
        sender_email = os.getenv("GMAIL_EMAIL")
        sender_password = os.getenv("GMAIL_PASSWORD")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = f"Application for {job_title}"
        
        # Email body
        body = f"""Dear {hiring_manager_name},

Please find attached my cover letter and CV for your review.

Best regards"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach cover letter as PDF
        cover_letter_pdf = generate_cover_letter_pdf(cover_letter)
        part = MIMEApplication(cover_letter_pdf.read(), Name="cover_letter.pdf")
        part['Content-Disposition'] = 'attachment; filename="cover_letter.pdf"'
        msg.attach(part)
        
        # Attach CV as text file (or PDF if available)
        cv_part = MIMEText(cv_text)
        cv_part['Content-Disposition'] = 'attachment; filename="cv.txt"'
        msg.attach(cv_part)
        
        # Send via Gmail
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False