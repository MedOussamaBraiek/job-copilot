import re

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IGNORED_DOMAINS = ("example.com", "sentry.io", "wixpress.com")
IGNORED_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")

NAME_PLACEHOLDER = re.compile(r"\[(?:your\s+)?(?:full\s+)?name\]", re.IGNORECASE)
PHONE_PLACEHOLDER = re.compile(r"\[(?:your\s+)?phone(?:\s+number)?\]", re.IGNORECASE)
EMAIL_PLACEHOLDER = re.compile(r"\[(?:your\s+)?e-?mail(?:\s+address)?\]", re.IGNORECASE)
MANAGER_PLACEHOLDER = re.compile(r"\[hiring\s+manager[’']?s?\s+name\]", re.IGNORECASE)


def find_hiring_email(text: str) -> str | None:
    for email in EMAIL_PATTERN.findall(text or ""):
        domain = email.split("@")[1].lower()
        if domain in IGNORED_DOMAINS or domain.endswith(IGNORED_SUFFIXES):
            continue
        return email.lower()
    return None


def guess_company_name(title: str) -> str | None:
    if " at " in title:
        name = title.split(" at ", 1)[1]
    elif " - " in title:
        name = title.rsplit(" - ", 1)[1]
    else:
        return None
    name = name.split(" | ")[0].strip()
    return name or None


def fill_placeholders(text: str, name: str, email: str, phone: str) -> str:
    text = MANAGER_PLACEHOLDER.sub("Hiring Manager", text)
    text = NAME_PLACEHOLDER.sub(name or "", text)
    text = PHONE_PLACEHOLDER.sub(phone or "", text)
    text = EMAIL_PLACEHOLDER.sub(email or "", text)
    return text
