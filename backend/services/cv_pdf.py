from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from models import TailoredCV
from services.email_service import PDF_CHAR_MAP

ACCENT = colors.HexColor("#1e3a8a")
MUTED = colors.HexColor("#6b7280")
SCALES = (1.0, 0.92, 0.85, 0.78, 0.72)


def _t(text: str) -> str:
    return escape(text.translate(PDF_CHAR_MAP))


def _render(cv: TailoredCV, scale: float) -> tuple[BytesIO, int]:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )
    base = getSampleStyleSheet()["Normal"]
    name_style = ParagraphStyle("Name", parent=base, fontName="Helvetica-Bold", fontSize=22 * scale, leading=26 * scale, textColor=ACCENT)
    headline_style = ParagraphStyle("Headline", parent=base, fontSize=11 * scale, leading=14 * scale, textColor=MUTED)
    muted_style = ParagraphStyle("Muted", parent=base, fontSize=9 * scale, leading=12 * scale, textColor=MUTED)
    section_style = ParagraphStyle("Section", parent=base, fontName="Helvetica-Bold", fontSize=9.5 * scale, leading=12 * scale, textColor=ACCENT, spaceBefore=8 * scale, spaceAfter=2 * scale)
    body_style = ParagraphStyle("Body", parent=base, fontSize=9.5 * scale, leading=12.5 * scale)
    bullet_style = ParagraphStyle("Bullet", parent=body_style, leftIndent=12, bulletIndent=2)
    role_style = ParagraphStyle("Role", parent=body_style, fontName="Helvetica-Bold")
    period_style = ParagraphStyle("Period", parent=muted_style, alignment=TA_RIGHT)

    story = [Paragraph(_t(cv.name), name_style)]
    if cv.headline:
        story.append(Paragraph(_t(cv.headline), headline_style))
    contact = "  |  ".join(part for part in (cv.email, cv.phone, cv.location) if part)
    if contact:
        story.append(Paragraph(_t(contact), muted_style))

    def section(title: str) -> list:
        return [
            Paragraph(title.upper(), section_style),
            HRFlowable(width="100%", thickness=0.8, color=ACCENT, spaceAfter=4 * scale),
        ]

    if cv.summary:
        story += section("Profile") + [Paragraph(_t(cv.summary), body_style)]

    if cv.skills:
        story += section("Skills") + [Paragraph(_t("  •  ".join(cv.skills)), body_style)]

    if cv.experience:
        story += section("Experience")
        for exp in cv.experience:
            row = Table(
                [[
                    Paragraph(_t(f"{exp.title} — {exp.company}"), role_style),
                    Paragraph(_t(exp.period), period_style),
                ]],
                colWidths=[doc.width * 0.75, doc.width * 0.25],
            )
            row.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]))
            story.append(row)
            for bullet in exp.bullets:
                story.append(Paragraph(_t(bullet), bullet_style, bulletText="•"))
            story.append(Spacer(1, 4 * scale))

    if cv.projects:
        story += section("Projects")
        for project in cv.projects:
            story.append(Paragraph(_t(project.name), role_style))
            if project.description:
                story.append(Paragraph(_t(project.description), body_style))
            meta = []
            if project.tech:
                meta.append("Tech: " + "  •  ".join(project.tech))
            if project.link:
                meta.append(project.link)
            if meta:
                story.append(Paragraph(_t("   |   ".join(meta)), muted_style))
            story.append(Spacer(1, 3 * scale))

    if cv.education:
        story += section("Education")
        for edu in cv.education:
            story.append(Paragraph(
                f"<b>{_t(edu.degree)}</b> — {_t(edu.school)}  <font color='#6b7280'>{_t(edu.period)}</font>",
                body_style,
            ))

    if cv.certificates:
        story += section("Certificates")
        for cert in cv.certificates:
            story.append(Paragraph(_t(cert), bullet_style, bulletText="•"))

    if cv.languages:
        story += section("Languages")
        story.append(Paragraph(_t("  •  ".join(cv.languages)), body_style))

    pages = [0]

    def count_page(canvas, _doc):
        pages[0] += 1

    doc.build(story, onFirstPage=count_page, onLaterPages=count_page)
    buffer.seek(0)
    return buffer, pages[0]


def tailored_cv_to_pdf(cv: TailoredCV) -> BytesIO:
    buffer = BytesIO()
    for scale in SCALES:
        buffer, pages = _render(cv, scale)
        if pages == 1:
            break
    return buffer
