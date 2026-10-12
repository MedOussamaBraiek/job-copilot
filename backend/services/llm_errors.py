import re

from groq import RateLimitError


def friendly_llm_error(error: Exception) -> str | None:
    if not isinstance(error, RateLimitError):
        return None
    match = re.search(r"try again in ([\w.]+)", str(error))
    wait = match.group(1) if match else "a few minutes"
    return f"The AI service is at its usage limit right now. Try again in {wait}."
