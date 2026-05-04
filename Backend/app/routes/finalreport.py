from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import os
import io
import json
import re
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

from app.routes.interview import get_session_data
from app.utils.database import get_application_and_job, save_interview_report_to_db, get_interview_report
from app.schemas import (
    FinalReportRequest,
    FinalReportResponse,
    CheckInterviewDataResponse,
    InterviewReport,
    EligibilityInfo,
    ScoreBreakdown,
    SkillsAssessment,
    CandidateAssessment,
    ProctoringReport,
    ProctorEvent,
    GeminiAnalysisResult
)

load_dotenv()

router = APIRouter(prefix="/final-report", tags=["final-report"])


def _build_fallback_analysis(rating: int, proctor_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Fallback analysis when Gemini fails"""
    print("⚠️ Using fallback analysis")
    
    integrity_score = max(0, 100 - (len(proctor_events) * 15))
    technical_score = min(100, rating * 20)
    communication_score = min(100, rating * 20 + 20)
    
    return {
        "technical_score": technical_score,
        "communication_score": communication_score,
        "integrity_score": integrity_score,
        "experience_match": 50,
        "skills_match": 50,
        "job_match_score": 50,
        "overall_score": int((technical_score * 0.3) + (communication_score * 0.3) + (integrity_score * 0.4)),
        "required_skills": [],
        "demonstrated_skills": [],
        "skill_gaps": [],
        "strengths": ["Completed interview"],
        "weaknesses": ["Analysis unavailable"],
        "eligibility_status": "Pending Review",
        "eligibility_reasoning": f"Automatic analysis failed. Rating: {rating}/5. Violations: {len(proctor_events)}",
        "detailed_feedback": "Manual review recommended",
        "hiring_recommendation": "Maybe"
    }


@router.post("/generate", response_model=FinalReportResponse)
async def generate_final_report(request: FinalReportRequest):
    """Generate comprehensive final report with Gemini analysis and save to database"""
    try:
        session_id = request.session_id
        application_id = request.application_id
        
        print(f"\n{'='*80}")
        print(f"📊 GENERATING FINAL REPORT")
        print(f"   Session: {session_id}")
        print(f"   Application: {application_id}")
        print(f"{'='*80}")
        
        # Get interview session data
        session = get_session_data(session_id)
        print(f"✓ Session loaded: {len(session.get('transcript', []))} turns, {len(session.get('proctor_events', []))} violations")
        
        # Get application and job details
        app_job_data = get_application_and_job(application_id)
        application = app_job_data["application"]
        job = app_job_data["job"]
        
        job_description = job.get("description", "")
        job_title = job.get("role_title", "Unknown Position")
        required_skills_raw = job.get("skills_needed", "")
        
        # Extract basic data from session
        review = session.get("review", {})
        rating = review.get("rating", 3)
        feedback = review.get("feedback", "")
        
        proctor_events = session.get("proctor_events", [])
        proctoring_details = {
            "total_violations": len(proctor_events),
            "events": proctor_events
        }
        
        # Analyze audio if present
        audio_analysis = "No audio provided"
        if "audio_content" in session:
            try:
                print(f"\n🎙️ Processing audio...")
                audio_content = session["audio_content"]
                
                api_key = os.getenv("LLM_API_KEY")
                if not api_key:
                    raise RuntimeError("LLM_API_KEY not configured")
                
                genai.configure(api_key=api_key)
                model_name = os.getenv("LLM_MODEL", "gemini-3-flash-preview")
                model = genai.GenerativeModel(model_name)
                
                print(f"   Uploading to Gemini...")
                audio_file = genai.upload_file(io.BytesIO(audio_content), mime_type="audio/webm")
                
                print(f"   Analyzing...")
                response = model.generate_content([
                    """Analyze this interview recording. Provide a report covering:
1. Communication Quality: Clarity, confidence, pace
2. Technical Knowledge: Topics discussed and depth
3. Key Topics: Main subjects covered
4. Strengths: What candidate did well
5. Improvements: Areas for improvement
6. Engagement: Interest and engagement level
7. Overall Assessment: Excellent/Good/Average/Needs Improvement""",
                    audio_file
                ])
                
                audio_analysis = response.text
                print(f"   ✅ Audio analysis done")
                
            except Exception as e:
                print(f"   ⚠️ Audio analysis failed: {str(e)}")
                audio_analysis = f"Audio analysis failed: {str(e)}"
        
        # Build interview transcript
        transcript = session.get("transcript", [])
        interview_transcript = "\n".join([
            f"{turn.get('role', 'unknown').upper()}: {turn.get('text', '')}"
            for turn in transcript
        ]) or "No transcript"
        
        # Get Gemini analysis
        print(f"\n📊 Sending to Gemini for eligibility assessment...")
        
        analysis_prompt = f"""Analyze this interview and provide eligibility assessment. Return ONLY valid JSON.

POSITION: {job_title}
RATING: {rating}/5

INTERVIEW TRANSCRIPT (first 2000 chars):
{interview_transcript[:2000]}

JOB REQUIREMENTS:
{job_description[:800]}
Skills: {required_skills_raw}

AUDIO ANALYSIS:
{audio_analysis[:800]}

PROCTORING:
Violations: {len(proctor_events)}

CANDIDATE:
Skills: {', '.join(application.get('key_skills', [])[:5] if isinstance(application.get('key_skills'), list) else [])}

Return this JSON format (no markdown):
{{
  "technical_score": 0-100,
  "communication_score": 0-100,
  "integrity_score": 0-100,
  "experience_match": 0-100,
  "skills_match": 0-100,
  "job_match_score": 0-100,
  "overall_score": 0-100,
  "required_skills": ["skill1", "skill2"],
  "demonstrated_skills": ["skill1"],
  "skill_gaps": ["skill1"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "eligibility_status": "Eligible|Not Eligible|Pending Review",
  "eligibility_reasoning": "detailed explanation",
  "detailed_feedback": "comprehensive feedback",
  "hiring_recommendation": "Strong Yes|Yes|Maybe|No"
}}"""
        
        gemini_analysis = None
        
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(analysis_prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)
                gemini_analysis = json.loads(json_str)
                print(f"   ✅ Gemini analysis complete")
            else:
                raise ValueError("No JSON in response")
                
        except Exception as e:
            print(f"   ⚠️ Gemini failed: {str(e)}")
            gemini_analysis = _build_fallback_analysis(rating, proctor_events)
        
        # Save to database
        print(f"\n💾 SAVING TO DATABASE...")
        db_result = save_interview_report_to_db(
            application_id=application_id,
            rating=rating,
            feedback=feedback,
            proctoring_details=proctoring_details,
            audio_analysis=audio_analysis,
            gemini_analysis=gemini_analysis
        )
        
        # Verify
        print(f"\n✓ VERIFYING DATABASE SAVE...")
        saved_report = get_interview_report(application_id)
        database_saved = saved_report is not None and saved_report.get("interview_status") == "completed"
        
        if database_saved:
            print(f"✅ DATA SAVED SUCCESSFULLY")
        else:
            print(f"❌ VERIFICATION FAILED")
        
        # Build report for frontend
        comprehensive_report = {
            "session_id": session_id,
            "application_id": application_id,
            "position": job_title,
            "interview_date": datetime.now().isoformat(),
            "candidate_rating": rating,
            "eligibility": {
                "status": gemini_analysis.get("eligibility_status", "Pending Review"),
                "recommendation": gemini_analysis.get("hiring_recommendation", "Pending"),
                "reasoning": gemini_analysis.get("eligibility_reasoning", "")
            },
            "scores": {
                "overall": gemini_analysis.get("overall_score", 0),
                "technical": gemini_analysis.get("technical_score", 0),
                "communication": gemini_analysis.get("communication_score", 0),
                "integrity": gemini_analysis.get("integrity_score", 0),
                "job_match": gemini_analysis.get("job_match_score", 0),
                "experience_match": gemini_analysis.get("experience_match", 0),
                "skills_match": gemini_analysis.get("skills_match", 0)
            },
            "skills": {
                "required": gemini_analysis.get("required_skills", []),
                "demonstrated": gemini_analysis.get("demonstrated_skills", []),
                "gaps": gemini_analysis.get("skill_gaps", [])
            },
            "assessment": {
                "strengths": gemini_analysis.get("strengths", []),
                "weaknesses": gemini_analysis.get("weaknesses", []),
                "feedback": gemini_analysis.get("detailed_feedback", "")
            },
            "proctoring": {
                "violations": len(proctor_events),
                "events": proctor_events
            },
            "audio_analysis": audio_analysis,
            "candidate_feedback": feedback,
            "database_saved": database_saved
        }
        
        print(f"\n{'='*80}")
        print(f"✅ REPORT GENERATED SUCCESSFULLY")
        print(f"{'='*80}\n")
        
        return {
            "ok": True,
            "session_id": session_id,
            "application_id": application_id,
            "report": comprehensive_report,
            "database_saved": database_saved
        }
        
    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ ERROR: {str(e)}")
        print(f"{'='*80}\n")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{application_id}")
async def check_interview_data(application_id: str):
    """Check if interview data was saved"""
    try:
        report = get_interview_report(application_id)
        
        if report is None:
            return {"ok": False, "saved": False, "message": "No data found"}
        
        return {
            "ok": True,
            "saved": report.get("interview_status") == "completed",
            "rating": report.get("interview_rating"),
            "score": report.get("overall_score"),
            "eligibility": report.get("eligibility_status")
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}