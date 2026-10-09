import os

from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import applications

load_dotenv()
app = FastAPI(title = "Job Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://job-copilot-helper.vercel.app",
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)

@app.get("/health")
def root():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)