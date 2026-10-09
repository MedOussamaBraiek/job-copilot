# Job Copilot

An AI assistant for job applications. Upload your CV, paste a job description (or link), and get a match score, gaps and strengths, a tailored cover letter, a draft email, and a CV rewritten for that job as a designed PDF. Then send the application straight to the hiring manager, or download everything and apply yourself.

## Features

- **CV analysis:** extracts your CV from PDF and scores the match against the job (0–100).
- **Streaming progress:** the UI shows each agent step (parsing, scoring, writing) as it happens.
- **Cover letter and draft email:** generated from the job, your gaps and strengths, using your real name and contact details.
- **Feedback loop:** approve, or reject with feedback to regenerate.
- **Tailored CV:** rewrites your CV for the job using only facts already in it, rendered as a one-page PDF.
- **Send by email:** emails the hiring manager with the cover letter and CV (saved or tailored) attached as PDF.
- **Application tracking:** status (pending, applied, emailed), company name, job link, history and details pages.

## Architecture

```
┌──────────────┐   HTTP / SSE   ┌────────────────────────────┐
│  Next.js UI  │ ─────────────▶ │  FastAPI backend           │
│  (frontend)  │ ◀───────────── │                            │
└──────────────┘                │  LangGraph supervisor      │
                                │   ├─ parser agent          │
                                │   ├─ scorer agent          │
                                │   └─ letter agent          │
                                │                            │
                                │  Tavily (job search)       │
                                │  Groq LLM (gpt-oss-120b)   │
                                │  Gmail SMTP (sending)      │
                                └──────────────┬─────────────┘
                                               │
                                       ┌───────▼────────┐
                                       │   PostgreSQL   │
                                       └────────────────┘
```

## Tech stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, Base UI
- **Backend:** FastAPI, SQLAlchemy, Pydantic
- **AI:** LangGraph (multi-agent supervisor), LangChain, Groq
- **Data:** PostgreSQL (psycopg), Tavily search
- **Documents:** pdfplumber (CV input), ReportLab (PDF output)
- **Infrastructure:** Docker for the backend and database

## Project structure

```
job-copilot-fullstack/
├── backend/
│   ├── agents/          # LangGraph agents: parser, scorer, letter, supervisor
│   ├── routers/         # API endpoints (applications)
│   ├── services/        # database, email, PDF rendering, job helpers
│   ├── models.py        # Pydantic request and response schemas
│   ├── main.py          # FastAPI app and CORS
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── app/             # pages: home, history, application details
    ├── components/      # upload form, progress, application actions, CV preview
    └── lib/             # API config, types, notifications
```

## Getting started

### Prerequisites

- Python 3.12
- Node.js 20+
- Docker Desktop
- API keys: [Groq](https://console.groq.com), [Tavily](https://tavily.com), and a Gmail app password

### 1. Start the database

```bash
docker run --name job-copilot-db -e POSTGRES_USER=jobcopilot -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=job_copilot -p 5433:5432 -v job-copilot-data:/var/lib/postgresql/data -d postgres:16
```

### 2. Configure and run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=your-groq-key
TAVILY_API_KEY=your-tavily-key
DATABASE_URL=postgresql+psycopg://jobcopilot:devpassword@localhost:5433/job_copilot
GMAIL_EMAIL=you@gmail.com
GMAIL_PASSWORD=your-16-char-app-password
```

Start the API:

```bash
uvicorn main:app --reload
```

The tables are created automatically on startup. The API docs are at http://localhost:8000/docs.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### Running the backend in Docker

```bash
cd backend
docker build -t job-copilot-backend .
docker run --rm -p 8000:8000 --env-file .env -e DATABASE_URL=postgresql+psycopg://jobcopilot:devpassword@host.docker.internal:5433/job_copilot job-copilot-backend
```

Inside a container, `localhost` refers to the container itself, so the database address is overridden to `host.docker.internal`.

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | backend `.env` | LLM calls |
| `TAVILY_API_KEY` | backend `.env` | Reading job postings from a URL |
| `DATABASE_URL` | backend `.env` | PostgreSQL connection |
| `GMAIL_EMAIL`, `GMAIL_PASSWORD` | backend `.env` | Sending application emails |
| `CORS_ORIGINS` | backend `.env` (optional) | Comma-separated frontend origins allowed to call the API |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` (optional) | Backend address, defaults to `http://localhost:8000` |

Never commit `.env` files. They are ignored by Git.

## Notes

- **Job links:** search-results links (such as LinkedIn search pages) don't point to one job. Paste the job description for the most reliable results.
- **Rate limits:** the Groq free tier limits tokens per minute and per day. Each analysis makes several LLM calls, so heavy testing can hit the limit.
- **Hiring email:** postings rarely include one. If none is found, type the address in the send form.

## Roadmap

- Deploy the backend (Render) and frontend (Vercel) with a managed PostgreSQL database
- Search for matching jobs automatically and propose applications
- Regenerate with contact details applied to the feedback path
