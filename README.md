<p align="center">
  <img src="frontend/public/banner-v2.png" alt="Job Copilot" width="100%" />
</p>

# Job Copilot

An AI assistant for job applications. Upload your CV, paste a job description (or link), and get a match score, gaps and strengths, a tailored cover letter, a draft email, and a CV rewritten for that job as a designed one-page PDF. Then email the application to the hiring manager, or download everything and apply yourself.

**Live demo:** https://job-copilot-helper.vercel.app

## Features

- **Sign-in with Google:** each user sees only their own applications (Clerk).
- **CV analysis:** extracts your CV from PDF and scores the match against the job (0–100).
- **Streaming progress:** the UI shows each agent step (parsing, scoring, writing) as it happens.
- **Cover letter and draft email:** generated from the job, your gaps and strengths, using your real name and contact details.
- **Feedback loop:** approve, or reject with feedback to regenerate.
- **Tailored CV:** rewrites your CV for the job using only facts already in it, rendered as a one-page PDF with projects, skills, and experience.
- **Send by email:** emails the hiring manager with the drafted email, the cover letter, and your saved or tailored CV attached as PDF.
- **Application tracking:** status (pending, applied, emailed), company name, job link, history and details pages.
- **Admin dashboard:** see all users and their application counts, ban or unban accounts, and delete users with their applications.

## Architecture

```
┌──────────────┐  sign-in   ┌──────────────┐
│    Clerk     │ ◀────────▶ │  Next.js UI  │
└──────────────┘  token     │  (frontend)  │
                            └──────┬───────┘
                                   │ HTTP / SSE (Bearer token)
                            ┌──────▼──────────────────────┐
                            │  FastAPI backend            │
                            │                             │
                            │  LangGraph supervisor       │
                            │   ├─ parser agent           │
                            │   ├─ scorer agent           │
                            │   └─ letter agent           │
                            │                             │
                            │  Tavily (job search)        │
                            │  Groq LLM (gpt-oss-120b)    │
                            │  Gmail SMTP (sending)       │
                            │  Clerk API (users, admin)   │
                            └──────────────┬──────────────┘
                                           │
                                   ┌───────▼────────┐
                                   │   PostgreSQL   │
                                   └────────────────┘
```

## Tech stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, Base UI, Clerk
- **Backend:** FastAPI, SQLAlchemy, Pydantic, PyJWT
- **AI:** LangGraph (multi-agent supervisor), LangChain, Groq
- **Data:** PostgreSQL (psycopg), Tavily search
- **Documents:** pdfplumber (CV input), ReportLab (PDF output)
- **Infrastructure:** Docker, Render (backend and database), Vercel (frontend)

## Project structure

```
job-copilot-fullstack/
├── backend/
│   ├── agents/          # LangGraph agents: parser, scorer, letter, supervisor
│   ├── routers/         # API endpoints: applications, admin
│   ├── services/        # auth, database, email, PDF rendering, job helpers
│   ├── models.py        # Pydantic request and response schemas
│   ├── main.py          # FastAPI app and CORS
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── app/             # pages: home, history, details, admin, sign-in
    ├── components/      # upload form, progress, actions, CV preview, header
    ├── lib/             # API config, auth helper, types, notifications
    └── proxy.ts         # Clerk route protection
```

## Getting started

### Prerequisites

- Python 3.12
- Node.js 20+
- Docker Desktop
- API keys: [Groq](https://console.groq.com), [Tavily](https://tavily.com), [Clerk](https://clerk.com) (with Google sign-in enabled), and a Gmail app password

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
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://your-frontend-api.clerk.accounts.dev/.well-known/jwks.json
```

Start the API:

```bash
uvicorn main:app --reload
```

The tables are created automatically on startup. The API docs are at http://localhost:8000/docs.

### 3. Configure and run the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and sign in with Google.

### Running the backend in Docker

```bash
cd backend
docker build -t job-copilot-backend .
docker run --rm -p 8000:8000 --env-file .env -e DATABASE_URL=postgresql+psycopg://jobcopilot:devpassword@host.docker.internal:5433/job_copilot job-copilot-backend
```

Inside a container, `localhost` refers to the container itself, so the database address is overridden to `host.docker.internal`.

### Making yourself an admin

In the Clerk dashboard, open your user and set the public metadata to:

```json
{"role": "admin"}
```

The **Admin** link appears in the header, and the `/admin` page becomes available.

## Configuration

**Backend (`backend/.env`, or the host's environment variables in production)**

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | LLM calls |
| `TAVILY_API_KEY` | Reading job postings from a URL |
| `DATABASE_URL` | PostgreSQL connection |
| `GMAIL_EMAIL`, `GMAIL_PASSWORD` | Sending application emails |
| `CLERK_SECRET_KEY` | Clerk API (admin tools) |
| `CLERK_JWKS_URL` | Verifying Clerk session tokens |
| `CORS_ORIGINS` (optional) | Comma-separated frontend origins allowed to call the API |

**Frontend (`frontend/.env.local`, or Vercel's environment variables)**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk sign-in in the browser |
| `CLERK_SECRET_KEY` | Clerk middleware on the server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page path |
| `NEXT_PUBLIC_API_URL` (optional) | Backend address, defaults to the live API in production and `http://localhost:8000` in development |

Never commit `.env` files. They are ignored by Git.

## Notes

- **Job links:** search-results links (such as LinkedIn search pages) don't point to one job. Paste the job description for the most reliable results.
- **Rate limits:** the Groq free tier limits tokens per minute and per day. Each analysis makes several LLM calls, so heavy testing can hit the limit.
- **Hiring email:** postings rarely include one. If none is found, type the address in the send form.
- **Free hosting:** the Render free tier sleeps when idle, so the first request after a pause can take a while.

## Roadmap

- More reliable email delivery over HTTPS instead of SMTP
- Search for matching jobs automatically and propose applications
- Editable company name and job description on the upload form
