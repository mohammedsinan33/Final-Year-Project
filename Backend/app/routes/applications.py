from fastapi import APIRouter, HTTPException
from typing import Any, Dict, List, Optional
import os
import json
import requests
from dotenv import load_dotenv
load_dotenv()

from app.utils.resume import extract_resume_text
from app.llm_client import analyze_resume_with_llm

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

@router.post("/process-due-screenings")
async def process_due_screenings(limit: int = 50):
    try:
        # pending applications
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

            # get screening date + jd + skills from job table
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
                # no screening date means do not process yet
                continue

            try:
                print(f"Processing app {app_id}...")
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