import os
import requests
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

def _headers() -> Dict[str, str]:
    """Get standard Supabase headers with authentication"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

def _sb_get(path: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
    """Make a GET request to Supabase REST API"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/{path}"
        print(f"🔍 GET {path}")
        
        response = requests.get(url, headers=_headers(), params=params, timeout=30)
        
        if response.status_code >= 300:
            print(f"❌ GET failed: {response.status_code} - {response.text}")
            raise RuntimeError(f"GET failed: {response.status_code}")
        
        data = response.json() if response.text else []
        return data
    except Exception as e:
        print(f"❌ Error in _sb_get: {str(e)}")
        raise

def _sb_patch(path: str, params: Dict[str, str], payload: Dict[str, Any]) -> Dict[str, Any]:
    """Make a PATCH request to Supabase REST API"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/{path}"
        print(f"🔧 PATCH {path}")
        print(f"   Updating with {len(payload)} fields")
        
        response = requests.patch(
            url,
            headers=_headers(),
            params=params,
            json=payload,
            timeout=30
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code >= 300:
            print(f"❌ PATCH failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            raise RuntimeError(f"PATCH failed: {response.status_code}")
        
        return response.json() if response.text else {}
    except Exception as e:
        print(f"❌ Error in _sb_patch: {str(e)}")
        raise

def get_application_and_job(application_id: str) -> Dict[str, Any]:
    """Fetch application and associated job details"""
    try:
        print(f"\n📋 Fetching application {application_id}...")
        
        # Fetch application
        app_data = _sb_get(
            "job_applications",
            {
                "select": "id,job_id,candidate_id,key_skills,experience,highlights,description",
                "id": f"eq.{application_id}",
            }
        )
        
        if not app_data or len(app_data) == 0:
            raise RuntimeError(f"Application {application_id} not found")
        
        application = app_data[0]
        job_id = application.get("job_id")
        
        if not job_id:
            raise RuntimeError(f"Application has no associated job")
        
        # Fetch job details
        print(f"   Fetching job {job_id}...")
        job_data = _sb_get(
            "recruiter_job_openings",
            {
                "select": "id,role_title,description,skills_needed",
                "id": f"eq.{job_id}",
            }
        )
        
        job = job_data[0] if job_data and len(job_data) > 0 else {}
        
        print(f"✅ Fetched application and job")
        return {
            "application": application,
            "job": job
        }
    except Exception as e:
        print(f"❌ Error fetching application and job: {str(e)}")
        raise

def save_interview_report_to_db(
    application_id: str,
    rating: int,
    feedback: str,
    proctoring_details: Dict[str, Any],
    audio_analysis: str,
    gemini_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Save comprehensive interview report to job_applications table"""
    try:
        print(f"\n💾 SAVING TO DATABASE")
        print(f"   Application: {application_id}")
        
        # Prepare payload
        payload = {
            "interview_status": "completed",
            "interview_rating": int(rating),
            "interview_feedback": str(feedback)[:2000],
            "audio_analysis": str(audio_analysis)[:5000],
            "proctoring_violations": len(proctoring_details.get("events", [])),
            "proctoring_details": proctoring_details,
            "technical_score": float(gemini_analysis.get("technical_score", 0)),
            "communication_score": float(gemini_analysis.get("communication_score", 0)),
            "integrity_score": float(gemini_analysis.get("integrity_score", 0)),
            "experience_match": float(gemini_analysis.get("experience_match", 0)),
            "skills_match": float(gemini_analysis.get("skills_match", 0)),
            "overall_score": float(gemini_analysis.get("overall_score", 0)),
            "job_match_score": float(gemini_analysis.get("job_match_score", 0)),
            "eligibility_status": str(gemini_analysis.get("eligibility_status", "pending")),
            "eligibility_reasoning": str(gemini_analysis.get("eligibility_reasoning", ""))[:3000],
            "required_skills": gemini_analysis.get("required_skills", []),
            "demonstrated_skills": gemini_analysis.get("demonstrated_skills", []),
            "skill_gaps": gemini_analysis.get("skill_gaps", []),
            "interview_date_completed": datetime.now(timezone.utc).isoformat(),
            "final_assessment": gemini_analysis
        }
        
        # Update database
        result = _sb_patch(
            "job_applications",
            {"id": f"eq.{application_id}"},
            payload
        )
        
        print(f"✅ SAVED TO DATABASE")
        
        return {
            "ok": True,
            "application_id": application_id,
            "updated": True
        }
    except Exception as e:
        print(f"❌ ERROR saving to database: {str(e)}")
        raise

def get_interview_report(application_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve saved interview report"""
    try:
        data = _sb_get(
            "job_applications",
            {
                "select": "interview_status,interview_rating,overall_score,eligibility_status",
                "id": f"eq.{application_id}",
            }
        )
        
        if data and len(data) > 0:
            return data[0]
        
        return None
    except Exception as e:
        print(f"❌ Error retrieving report: {str(e)}")
        return None