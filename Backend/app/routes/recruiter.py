from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import os
from dotenv import load_dotenv
from app.utils.mails import send_offer_email, send_rejection_email
from datetime import datetime, timezone
import requests
import json

load_dotenv()

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

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

def _sb_get(path: str, params: Dict[str, str]) -> list:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers(), params=params, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase GET failed: {r.status_code} {r.text}")
    return r.json() if r.text else []

def _sb_patch(path: str, params: Dict[str, str], payload: Dict[str, Any]) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    print(f"🔧 PATCH {url}")
    print(f"   Params: {params}")
    print(f"   Payload: {payload}")
    
    r = requests.patch(url, headers=_headers(), params=params, data=json.dumps(payload), timeout=30)
    
    print(f"   Response Status: {r.status_code}")
    print(f"   Response: {r.text}")
    
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase PATCH failed: {r.status_code} {r.text}")


@router.post("/send-offer-email")
async def send_offer_email_route(payload: Dict[str, Any]):
    """Send offer email to selected candidate"""
    try:
        application_id = payload.get("application_id")
        job_title = payload.get("job_title")
        company_name = payload.get("company_name")
        
        if not application_id or not job_title:
            raise HTTPException(status_code=400, detail="Missing required fields: application_id, job_title")
        
        print(f"📧 Sending offer email for application {application_id}")
        
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
        
        # Get candidate email from app_users table
        users = _sb_get(
            "app_users",
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
        success = send_offer_email(
            candidate_email=candidate_email,
            job_title=job_title,
            company_name=company_name or "Our Company"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        print(f"✅ Offer email sent successfully")
        
        # Update selected = true
        try:
            _sb_patch(
                "job_applications",
                {"id": f"eq.{application_id}"},
                {"selected": True}
            )
            print(f"✅ Updated selected column to TRUE for {application_id}")
        except Exception as patch_err:
            print(f"⚠️ Warning: Could not update selected column: {str(patch_err)}")
        
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
        
        print(f"📧 Sending rejection email for application {application_id}")
        
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
        
        # Get candidate email from app_users table
        users = _sb_get(
            "app_users",
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
        success = send_rejection_email(
            candidate_email=candidate_email,
            job_title=job_title
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        print(f"✅ Rejection email sent successfully")
        
        # Update selected = false
        try:
            _sb_patch(
                "job_applications",
                {"id": f"eq.{application_id}"},
                {"selected": False}
            )
            print(f"✅ Updated selected column to FALSE for {application_id}")
        except Exception as patch_err:
            print(f"⚠️ Warning: Could not update selected column: {str(patch_err)}")
        
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