# Continental AI - Backend

FastAPI-based backend for the Continental AI recruitment platform.

## 🚀 Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Environment Setup

Create `.env` file:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
LLM_API_KEY=sk-...
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### Run Server

```bash
cd app
python main.py
```

Server runs on `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

## 📁 Project Structure

```
app/
├── __init__.py
├── main.py                 # FastAPI app entry point
├── llm_client.py           # Claude/OpenAI integration
├── schemas.py              # Pydantic models
├── routes/
│   ├── __init__.py
│   ├── applications.py     # Resume analysis & applications
│   ├── interview.py        # Interview management
│   ├── recruiter.py        # Recruiter operations
│   ├── proctor.py          # Proctoring system
│   ├── analyze.py          # Analysis endpoints
│   └── finalreport.py      # Report generation
└── utils/
    ├── __init__.py
    ├── database.py         # Supabase helpers
    ├── mails.py            # Email service
    ├── resume.py           # PDF/DOC text extraction
    ├── repo.py             # Repository pattern
    └── scheduler.py        # Background tasks
```

## 🔌 API Routes

### /applications - Resume & Application Management

```python
POST /applications/analyze-and-save-application
  # Analyze resume from upload
  Params: file (PDF), job_id, recruiter_id, candidate_id
  Response: { ok, match_score, match_summary }

POST /applications/process-due-screenings
  # Background job to process pending resumes
  Query: limit (default 50)
  Response: { processed, updated }

POST /applications/send-shortlist-notifications
  # Send shortlist/rejection emails
  Response: { shortlist_emails_sent, rejection_emails_sent, failed }

POST /applications/schedule-interview
  # Schedule interview
  Body: { app_id, scheduled_date_time }
  Response: { success, message }

POST /applications/submit-project
  # Submit project details
  Body: { app_id, project_repository_link, project_hosted_link, project_description }

GET /applications/candidates/{job_id}
  # Get all candidates for a job
  Response: [{ id, name, match_score, ... }]
```

### /interview - Interview Management

```python
POST /interview/schedule
  # Schedule interview session

GET /interview/{app_id}
  # Get interview details
```

### /recruiter - Recruiter Operations

```python
POST /recruiter/jobs
  # Create job opening
  Body: { title, description, skills_needed, ... }

GET /recruiter/jobs
  # List recruiter's job postings
```

### /proctor - Proctoring System

```python
POST /proctor/start-session
  # Start proctoring session

POST /proctor/validate-session
  # Validate proctored interview
```

## 🤖 AI/LLM Integration

### Resume Analysis

```python
# llm_client.py
async def analyze_resume_with_llm(
    resume_text: str,
    job_desc: str,
    skills_needed: str
) -> Dict[str, Any]:
    """
    Returns:
    {
        "description": "Profile summary",
        "key_skills": ["Python", "React", ...],
        "key_projects": ["Project 1", ...],
        "experience": ["5 years as...", ...],
        "education": ["BS Computer Science", ...],
        "highlights": ["Top skills", ...],
        "match_score": 85,  # 0-100
        "match_summary": "Strong match for role"
    }
    """
```

### Prompts

Configured in `llm_client.py` for:
- Resume text extraction
- Skill identification
- Experience evaluation
- Job matching
- Score calculation

## 📧 Email Service

### send_shortlist_email
```python
send_shortlist_email(
    candidate_email: str,
    match_score: int,
    job_title: str,
    next_link: str  # Link to interview/project
)
```

### send_rejection_email
```python
send_rejection_email(
    candidate_email: str,
    job_title: str
)
```

### send_offer_email
```python
send_offer_email(
    candidate_email: str,
    job_title: str,
    company_name: str
)
```

## 🔐 Authentication

Uses JWT tokens:
- Users register with email, password, role
- Token stored in localStorage (frontend)
- Service role key for server-to-server auth (Supabase)

```python
# In requests to Supabase
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}
```

## 📄 Resume Processing

### extract_resume_text
```python
# utils/resume.py
def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from PDF or DOC file
    Supports: .pdf, .doc, .docx
    """
```

Process:
1. Download resume from storage URL
2. Extract text using PDF/DOC parser
3. Send to LLM for analysis
4. Generate match score
5. Store results in database

## 🎯 Database (Supabase)

### Key Tables

**job_applications**
```
id (UUID) - Primary key
candidate_id (UUID) - FK to users
job_id (UUID) - FK to recruiter_job_openings
recruiter_id (UUID) - FK to users
resume_url (TEXT) - Storage path
resume_report_status (TEXT) - pending/done/failed
resume_report_generated_at (TIMESTAMP)
resume_shortlist_email_sent (BOOLEAN)
resume_shortlist_email_sent_at (TIMESTAMP)
interview_scheduled_date (TIMESTAMP)
interview_status (TEXT) - scheduled/completed
project_submitted (BOOLEAN)
project_repository_link (TEXT)
project_hosted_link (TEXT)
project_description (TEXT)
match_score (INT) - 0-100
match_summary (TEXT)
description (TEXT)
key_skills (JSONB) - Array of skills
key_projects (JSONB) - Array of projects
experience (JSONB) - Array
education (JSONB) - Array
highlights (JSONB) - Array
```

**recruiter_job_openings**
```
id (UUID)
recruiter_id (UUID)
job_title (TEXT)
description (TEXT)
skills_needed (JSONB)
screening_start_date (TIMESTAMP)
has_project_assignment (BOOLEAN)
created_at (TIMESTAMP)
```

## 🔄 Background Jobs

### process_due_screenings
Runs periodically to:
- Find applications with status "pending"
- Download resumes
- Analyze with LLM
- Update match scores
- Mark as "done" or "failed"

### send_shortlist_notifications
Sends emails when:
- Screening date starts
- Match score ≥ 60% → Shortlist email
- Match score < 60% → Rejection email

## 📦 Dependencies

See `requirements.txt`:
```
fastapi
uvicorn
supabase
python-dotenv
requests
pydantic
PyPDF2  # PDF reading
python-docx  # DOC/DOCX reading
python-multipart
aiofiles
pytz
```

## 🐛 Error Handling

### Common Errors

**Resume Download Failed**
- Check resume URL is public/signed correctly
- Verify Supabase storage permissions
- Check file exists in storage

**LLM API Error**
- Verify API key in .env
- Check API quota/rate limits
- Review API response in logs

**Email Not Sending**
- Verify SMTP credentials
- Gmail requires "App Password" (2FA)
- Check email whitelisting

**Database Connection**
- Verify SUPABASE_URL and SERVICE_ROLE_KEY
- Check internet connection
- Review Supabase status

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8000/docs

# Test endpoint
curl -X POST http://localhost:8000/applications/process-due-screenings
```

### Debug Logs
Check `app/main.py` for logging configuration:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Supabase project URL | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | ✅ |
| LLM_API_KEY | OpenAI/Claude API key | ✅ |
| FRONTEND_URL | Frontend base URL | ✅ |
| MAIL_USERNAME | Email for SMTP | ✅ |
| MAIL_PASSWORD | Email password/app password | ✅ |

## 🚀 Deployment

### Heroku

```bash
# Create Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Set environment variables
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
# ... etc

# Deploy
git push heroku main
```

### Railway/Render
- Connect GitHub repo
- Set environment variables
- Deploy automatically

## 📞 Support

For issues:
1. Check logs: `python app/main.py` output
2. Verify .env variables
3. Test database connection
4. Review API response in Postman/Thunder Client
5. Check Supabase console

---

**Project**: Continental AI
**Last Updated**: May 2026
