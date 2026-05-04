from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Any, Dict, List, Optional
import os
import json
import requests
from dotenv import load_dotenv
load_dotenv()

from app.utils.resume import extract_resume_text
from supabase import create_client
from app.llm_client import analyze_resume_with_llm
from app.utils.mails import send_shortlist_email, send_offer_email, send_rejection_email


router = APIRouter(prefix="/applications", tags=["applications"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

def _headers() -> Dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

def _sb_get(path: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers(), params=params, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase GET failed: {r.status_code} {r.text}")
    return r.json() if r.text else []

def _sb_patch(path: str, params: Dict[str, str], payload: Dict[str, Any]) -> None:
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers(), params=params, data=json.dumps(payload), timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase PATCH failed: {r.status_code} {r.text}")

def _download_resume(url: str) -> bytes:
    print(f"Downloading resume from: {url}")
    r = requests.get(url, timeout=45)
    if r.status_code >= 300:
        print(f"Response status: {r.status_code}")
        print(f"Response text: {r.text}")
        print(f"Response headers: {dict(r.headers)}")
        raise RuntimeError(f"Resume download failed: {r.status_code} - {r.text[:200]}")
    return r.content

def _get_signed_url(path: str, ttl: int = 3600) -> str:
    """Generate a signed URL for protected storage access using service role"""
    from datetime import datetime, timedelta, timezone
    import hmac
    import hashlib
    import base64
    from urllib.parse import quote
    
    # path format: "bucket/path/to/file"
    payload = {
        "url": path,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(seconds=ttl)).timestamp()),
    }
    
    # Create JWT manually for signed URL
    import json
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).rstrip(b'=')
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=')
    signing_input = header + b'.' + body
    
    sig = base64.urlsafe_b64encode(
        hmac.new(SUPABASE_SERVICE_ROLE_KEY.encode(), signing_input, hashlib.sha256).digest()
    ).rstrip(b'=')
    
    token = (signing_input + b'.' + sig).decode()
    
    return f"{SUPABASE_URL}/storage/v1/object/sign/{path}?token={token}"

@router.post("/process-due-screenings")
async def process_due_screenings(limit: int = 50):
    try:
        apps = _sb_get(
            "job_applications",
            {
                "select": "id,job_id,resume_url,resume_report_status",
                "resume_report_status": "eq.pending",
                "order": "created_at.asc",
                "limit": str(limit),
            },
        )

        if not apps:
            return {"ok": True, "processed": 0, "updated": 0}

        processed = 0
        updated = 0

        for app in apps:
            app_id = app.get("id")
            job_id = app.get("job_id")
            resume_url = (app.get("resume_url") or "").strip()

            print(f"App {app_id}: job_id={job_id}, resume_url={resume_url[:100] if resume_url else 'NONE'}")
            
            if not app_id or not job_id or not resume_url:
                print(f"Skipping app {app_id}: missing required fields")
                _sb_patch(
                    "job_applications",
                    {"id": f"eq.{app_id}"},
                    {"resume_report_status": "failed"},
                )
                continue

            jobs = _sb_get(
                "recruiter_job_openings",
                {
                    "select": "id,screening_start_date,description,skills_needed",
                    "id": f"eq.{job_id}",
                    "limit": "1",
                },
            )
            if not jobs:
                _sb_patch("job_applications", {"id": f"eq.{app_id}"}, {"resume_report_status": "failed"})
                continue

            job = jobs[0]
            screening_start = job.get("screening_start_date")
            if screening_start is None:
                continue

            try:
                print(f"Processing app {app_id}...")
                # Use public URL directly (no signed URL generation)
                file_bytes = _download_resume(resume_url)
                resume_text = extract_resume_text(file_bytes, "resume.pdf")
                if not resume_text.strip():
                    raise RuntimeError("No text extracted")

                report = await analyze_resume_with_llm(
                    resume_text=resume_text,
                    job_desc=job.get("description") or "",
                    skills_needed=job.get("skills_needed") or "",
                )

                print(f"LLM Report for app {app_id}: {json.dumps(report, indent=2)}")

                payload = {
                    "description": report.get("description") or "No profile summary available",
                    "key_skills": report.get("key_skills") or [],
                    "key_projects": report.get("key_projects") or [],
                    "experience": report.get("experience") or [],
                    "education": report.get("education") or [],
                    "highlights": report.get("highlights") or [],
                    "match_score": int(report.get("match_score") or 0),
                    "match_summary": report.get("match_summary") or "No job description provided for matching.",
                    "resume_report_status": "done",
                }

                from datetime import datetime, timezone
                payload["resume_report_generated_at"] = datetime.now(timezone.utc).isoformat()

                print(f"Payload for app {app_id}: {json.dumps(payload, indent=2)}")

                _sb_patch("job_applications", {"id": f"eq.{app_id}"}, payload)
                print(f"Successfully updated app {app_id}")
                updated += 1

            except Exception as e:
                print(f"ERROR processing app {app_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                _sb_patch("job_applications", {"id": f"eq.{app_id}"}, {"resume_report_status": "failed"})

        return {"ok": True, "processed": processed, "updated": updated}
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-and-save-application")
async def analyze_and_save_application(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    recruiter_id: str = Form(...),
    candidate_id: str = Form(...),
):
    """
    Directly analyze resume from upload and save to job_applications table
    """
    try:
        print(f"Analyzing resume for job_id={job_id}, candidate_id={candidate_id}")
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Extract resume text
        resume_text = extract_resume_text(file_bytes, file.filename or "resume.pdf")
        if not resume_text.strip():
            raise RuntimeError("No text extracted from resume")
        
        # Get job details (description + skills)
        jobs = _sb_get(
            "recruiter_job_openings",
            {
                "select": "description,skills_needed",
                "id": f"eq.{job_id}",
                "limit": "1",
            },
        )
        if not jobs:
            raise RuntimeError(f"Job {job_id} not found")
        
        job = jobs[0]
        
        # Analyze with LLM
        report = await analyze_resume_with_llm(
            resume_text=resume_text,
            job_desc=job.get("description") or "",
            skills_needed=job.get("skills_needed") or "",
        )
        
        print(f"Analysis result: {json.dumps(report, indent=2)}")
        
        # Create application with analysis results
        from datetime import datetime, timezone
        payload = {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "recruiter_id": recruiter_id,
            "resume_url": f"analyzed_{datetime.now(timezone.utc).isoformat()}",
            "description": report.get("description") or "No profile summary available",
            "key_skills": report.get("key_skills") or [],
            "key_projects": report.get("key_projects") or [],
            "experience": report.get("experience") or [],
            "education": report.get("education") or [],
            "highlights": report.get("highlights") or [],
            "match_score": int(report.get("match_score") or 0),
            "match_summary": report.get("match_summary") or "No match summary",
            "resume_report_status": "done",
            "resume_report_generated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Insert via RPC (or direct REST API)
        app_data = _sb_get(
            "job_applications",
            {
                "select": "*",
                "candidate_id": f"eq.{candidate_id}",
                "job_id": f"eq.{job_id}",
                "limit": "1",
            },
        )
        
        if app_data:
            # Update existing
            _sb_patch("job_applications", {"id": f"eq.{app_data[0]['id']}"}, payload)
        else:
            # Create new - use REST API directly
            r = requests.post(
                f"{SUPABASE_URL}/rest/v1/job_applications",
                headers=_headers(),
                json=payload,
                timeout=30,
            )
            if r.status_code >= 300:
                raise RuntimeError(f"Failed to create application: {r.text}")
        
        return {
            "ok": True,
            "message": "Resume analyzed and saved",
            "match_score": payload["match_score"],
            "match_summary": payload["match_summary"],
        }
        
    except Exception as e:
        print(f"ERROR analyzing resume: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-shortlist-notifications")
async def send_shortlist_notifications():
    """Send shortlist or rejection emails based on match_score and screening dates"""
    try:
        from app.utils.mails import send_shortlist_email, send_rejection_email
        from datetime import datetime
        import pytz
        from supabase import create_client
        
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        now = datetime.now(pytz.UTC)
        
        # Fetch ALL applications where email not sent yet
        applications = supabase.table("job_applications").select(
            "id, candidate_id, match_score, job_id, has_project_assignment, app_users(email)"
        ).filter(
            "resume_shortlist_email_sent", "eq", False
        ).execute()
        
        shortlist_count = 0
        rejection_count = 0
        failed_count = 0
        
        for app in applications.data:
            # Get candidate email
            candidate_email = app.get("app_users", {}).get("email") if app.get("app_users") else None
            
            if not candidate_email:
                print(f"Skipping app {app['id']}: no candidate email found")
                failed_count += 1
                continue
            
            # Get job details including screening_start_date
            job = supabase.table("recruiter_job_openings").select(
                "job_title, screening_start_date, has_project_assignment"
            ).eq("id", app["job_id"]).single().execute()
            
            if not job.data:
                failed_count += 1
                continue
            
            # Parse screening_start_date
            screening_start = datetime.fromisoformat(
                job.data["screening_start_date"].replace("Z", "+00:00")
            )
            
            # Only send if screening has started
            if now < screening_start:
                print(f"Screening hasn't started yet for app {app['id']}")
                continue
            
            match_score = app.get("match_score", 0)
            job_title = job.data.get("job_title", "Position")
            
            # Send appropriate email based on match_score
            if match_score >= 60:
                # SHORTLIST EMAIL
                if job.data.get("has_project_assignment"):
                    next_link = f"{FRONTEND_URL}/project?app_id={app['id']}&job_id={app['job_id']}"
                else:
                    next_link = f"{FRONTEND_URL}/interview?app_id={app['id']}&job_id={app['job_id']}"
                
                if send_shortlist_email(candidate_email, match_score, job_title, next_link):
                    shortlist_count += 1
                else:
                    failed_count += 1
            else:
                # REJECTION EMAIL
                if send_rejection_email(candidate_email, job_title):
                    rejection_count += 1
                else:
                    failed_count += 1
            
            # Mark email as sent
            supabase.table("job_applications").update(
                {
                    "resume_shortlist_email_sent": True,
                    "resume_shortlist_email_sent_at": now.isoformat()
                }
            ).eq("id", app["id"]).execute()
        
        return {
            "success": True,
            "shortlist_emails_sent": shortlist_count,
            "rejection_emails_sent": rejection_count,
            "emails_failed": failed_count,
            "total_processed": shortlist_count + rejection_count + failed_count
        }
        
    except Exception as e:
        print(f"Error sending notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500

@router.post("/submit-project")
async def submit_project_details(payload: Dict[str, Any]):
    """Submit project details for a job application"""
    try:
        app_id = payload.get("app_id")
        project_repository_link = payload.get("project_repository_link")
        project_hosted_link = payload.get("project_hosted_link")
        project_description = payload.get("project_description")

        if not app_id:
            raise HTTPException(status_code=400, detail="app_id is required")
        if not project_repository_link:
            raise HTTPException(status_code=400, detail="project_repository_link is required")
        if not project_hosted_link:
            raise HTTPException(status_code=400, detail="project_hosted_link is required")
        if not project_description:
            raise HTTPException(status_code=400, detail="project_description is required")

        from datetime import datetime, timezone
        update_payload = {
            "project_repository_link": project_repository_link,
            "project_hosted_link": project_hosted_link,
            "project_description": project_description,
            "project_submitted": True,
            "project_submitted_at": datetime.now(timezone.utc).isoformat(),
        }

        _sb_patch("job_applications", {"id": f"eq.{app_id}"}, update_payload)
        return {"ok": True, "message": "Project details submitted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR submitting project: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-shortlist-notifications")
async def send_shortlist_notifications_manual():
    """Manual endpoint to send pending emails"""
    from app.utils.mails import send_all_pending_notifications
    return await send_all_pending_notifications()

@router.post("/schedule-interview")
async def schedule_interview(payload: dict):
    """Schedule interview and update interview_scheduled_date in database"""
    app_id = payload.get("app_id")
    scheduled_date_time = payload.get("scheduled_date_time")

    if not app_id or not scheduled_date_time:
        raise HTTPException(status_code=400, detail="Missing app_id or scheduled_date_time")

    try:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(status_code=500, detail="Missing Supabase credentials")

        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        # Update the job_applications table with interview_scheduled_date
        response = supabase.table("job_applications").update({
            "interview_scheduled_date": scheduled_date_time,
            "interview_status": "scheduled"
        }).eq("id", app_id).execute()

        return {
            "success": True,
            "message": "Interview scheduled successfully",
            "app_id": app_id,
            "scheduled_date_time": scheduled_date_time
        }

    except Exception as e:
        print(f"❌ Error scheduling interview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scheduling interview: {str(e)}")


# ============================================
# RECRUITER CANDIDATE MANAGEMENT ROUTES
# ============================================

@router.post("/send-offer-email")
async def send_offer_email_route(payload: Dict[str, Any]):
    """Send offer email to selected candidate"""
    try:
        application_id = payload.get("application_id")
        job_title = payload.get("job_title")
        company_name = payload.get("company_name")
        
        if not application_id or not job_title:
            raise HTTPException(status_code=400, detail="Missing required fields: application_id, job_title")
        
        # Get candidate email from job_applications
        apps = _sb_get(
            "job_applications",
            {
                "select": "id,candidate_id",
                "id": f"eq.{application_id}",
                "limit": "1",
            },
        )
        
        if not apps:
            raise HTTPException(status_code=404, detail="Application not found")
        
        app = apps[0]
        candidate_id = app.get("candidate_id")
        
        # Get candidate email from users table
        users = _sb_get(
            "users",
            {
                "select": "email",
                "id": f"eq.{candidate_id}",
                "limit": "1",
            },
        )
        
        if not users or not users[0].get("email"):
            raise HTTPException(status_code=404, detail="Candidate email not found")
        
        candidate_email = users[0].get("email")
        
        # Send offer email
        from app.utils.mails import send_offer_email
        success = send_offer_email(
            candidate_email=candidate_email,
            job_title=job_title,
            company_name=company_name or "Our Company"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        # Update application status
        _sb_patch(
            "job_applications",
            {"id": f"eq.{application_id}"},
            {
                "application_status": "selected",
                "offer_email_sent": True,
                "offer_email_sent_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        
        return {
            "ok": True,
            "message": f"Offer email sent to {candidate_email}",
            "candidate_email": candidate_email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending offer email: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-rejection-email")
async def send_rejection_email_route(payload: Dict[str, Any]):
    """Send rejection email to candidate"""
    try:
        application_id = payload.get("application_id")
        job_title = payload.get("job_title")
        company_name = payload.get("company_name")
        
        if not application_id or not job_title:
            raise HTTPException(status_code=400, detail="Missing required fields: application_id, job_title")
        
        # Get candidate email from job_applications
        apps = _sb_get(
            "job_applications",
            {
                "select": "id,candidate_id",
                "id": f"eq.{application_id}",
                "limit": "1",
            },
        )
        
        if not apps:
            raise HTTPException(status_code=404, detail="Application not found")
        
        app = apps[0]
        candidate_id = app.get("candidate_id")
        
        # Get candidate email from users table
        users = _sb_get(
            "users",
            {
                "select": "email",
                "id": f"eq.{candidate_id}",
                "limit": "1",
            },
        )
        
        if not users or not users[0].get("email"):
            raise HTTPException(status_code=404, detail="Candidate email not found")
        
        candidate_email = users[0].get("email")
        
        # Send rejection email
        from app.utils.mails import send_rejection_email
        success = send_rejection_email(
            candidate_email=candidate_email,
            job_title=job_title
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        # Update application status
        _sb_patch(
            "job_applications",
            {"id": f"eq.{application_id}"},
            {
                "application_status": "rejected",
                "rejection_email_sent": True,
                "rejection_email_sent_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        
        return {
            "ok": True,
            "message": f"Rejection email sent to {candidate_email}",
            "candidate_email": candidate_email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending rejection email: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/candidates/{job_id}")
async def get_candidates_for_job(job_id: str):
    """Get all candidates for a specific job"""
    try:
        candidates = _sb_get(
            "job_applications",
            {
                "select": "id,candidate_id,resume_score,repo_score,interview_score,interview_status,task_status,overall_score,technical_score,communication_score,integrity_score,eligibility_status,eligibility_reasoning,match_score,application_status,users(id,email,fullName,phone,key_skills)",
                "job_id": f"eq.{job_id}",
                "order": "created_at.desc",
            },
        )
        
        # Transform data
        result = []
        for app in candidates:
            user = app.get("users", {}) if isinstance(app.get("users"), dict) else {}
            result.append({
                "id": app.get("id"),
                "application_id": app.get("id"),
                "candidate_id": app.get("candidate_id"),
                "name": user.get("fullName") or "Candidate",
                "email": user.get("email") or "N/A",
                "phone": user.get("phone") or "N/A",
                "skills": ", ".join(user.get("key_skills", [])) if isinstance(user.get("key_skills"), list) else user.get("key_skills", "N/A"),
                "resume_score": app.get("resume_score"),
                "repo_score": app.get("repo_score"),
                "interview_score": app.get("interview_score"),
                "interview_status": app.get("interview_status"),
                "task_status": app.get("task_status"),
                "overall_score": app.get("overall_score"),
                "technical_score": app.get("technical_score"),
                "communication_score": app.get("communication_score"),
                "integrity_score": app.get("integrity_score"),
                "eligibility_status": app.get("eligibility_status"),
                "eligibility_reasoning": app.get("eligibility_reasoning"),
                "match_score": app.get("match_score"),
                "application_status": app.get("application_status"),
            })
        
        return {
            "ok": True,
            "candidates": result,
            "total": len(result)
        }
        
    except Exception as e:
        print(f"❌ Error fetching candidates: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))