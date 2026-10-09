from dotenv import load_dotenv
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, Field
import json 

load_dotenv("./.env")

llm = ChatGroq(model="openai/gpt-oss-120b")

class LetterResult(BaseModel):
    cover_letter: str = Field(description="Professional cover letter")
    draft_email: str = Field(description="Draft email to send with letter")
    feedback: str = Field(description="Professional feedback based on gabs and strengths")

class LetterState(TypedDict):
    name: str
    email: str
    phone: str
    job_posting: str
    gaps: List[str]
    strengths: List[str]
    result : LetterResult  

def letter_node(state: LetterState) -> LetterState:
    """Generate cover letter and drafting email"""
    prompt=f"""
    Job description: {state['job_posting']}
    gaps: {state["gaps"]}
    strengths: {state["strengths"]}

     Generate:
    1. A professional cover letter
    2. A draft email
    3. Actionable feedback: What specific things should this candidate do to land this job?
    
    Constraints:
    - Cover letter: plain text, at most 250 words, 3 short paragraphs, so it fits on one page.
    - Draft email: first line is "Subject: ...", then a short body under 120 words saying the CV and cover letter are attached.

    Candidate details (use these exactly in the sign-off and the email):
    name: {state["name"]}
    email: {state["email"]}
    phone: {state["phone"]}
    Never write bracketed placeholders such as [Your Name] or [Phone Number].

    Return ONLY valid JSON (no markdown, no extra text):
    {{"cover_letter": "...", "draft_email": "...", "feedback": "..."}}
    """

    response = llm.invoke(prompt).content
    data = json.loads(response)
    
    result = LetterResult(
        cover_letter=data["cover_letter"],
        draft_email=data["draft_email"],
        feedback=data["feedback"]
    )
    return {"result": result}



writer_graph = StateGraph(LetterState)

writer_graph.add_node("write", letter_node)
writer_graph.add_edge(START, "write")
writer_graph.add_edge("write", END)

compiled_letter = writer_graph.compile()


if __name__ == "__main__":
    test_result = compiled_letter.invoke({
        "name": "Test Candidate",
        "email": "test@example.com",
        "phone": "+1 555 0100",
        "job_posting": "Senior Python dev. Need: Django, AWS",
        "gaps": ["Django", "AWS", "5yr exp"],
        "strengths": ["Python"]
    })
    print(test_result["result"].cover_letter)
    print("\n---\n")
    print(test_result["result"].draft_email)