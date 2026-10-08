import re

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IGNORED_DOMAINS = ("example.com", "sentry.io", "wixpress.com")
IGNORED_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")


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
