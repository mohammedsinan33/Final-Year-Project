from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import requests
from dotenv import load_dotenv
from app.schemas import SessionContextUpsertRequest, InterviewTurnIngestRequest

load_dotenv()

router = APIRouter()

SESSION_STORE: Dict[str, Dict[str, Any]] = {}

def _get_or_create_session(session_id: str) -> Dict[str, Any]:
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {
            "transcript": [],
            "qa_pairs": [],
            "proctor_events": [],
            "repo_analysis": {},
            "resume_analysis": {},
            "job_description": "",
            "skills_needed": "",
        }
    return SESSION_STORE[session_id]

def upsert_session_context(
    session_id: str,
    repo_analysis: Optional[Dict[str, Any]] = None,
    resume_analysis: Optional[Dict[str, Any]] = None,
    job_description: Optional[str] = "",
    skills_needed: Optional[str] = "",
) -> Dict[str, Any]:
    s = _get_or_create_session(session_id)
    if repo_analysis is not None:
        s["repo_analysis"] = repo_analysis
    if resume_analysis is not None:
        s["resume_analysis"] = resume_analysis
    if job_description is not None:
        s["job_description"] = job_description
    if skills_needed is not None:
        s["skills_needed"] = skills_needed
    return s

def record_interview_turn(session_id: str, role: str, text: str) -> Dict[str, Any]:
    s = _get_or_create_session(session_id)
    role_clean = (role or "").strip().lower()
    text_clean = (text or "").strip()
    if not text_clean:
        return s

    s["transcript"].append({"role": role_clean, "text": text_clean})

    if role_clean in ("agent", "ai", "assistant"):
        s["_last_question"] = text_clean
    elif role_clean in ("candidate", "user", "human"):
        last_q = s.get("_last_question")
        if last_q:
            s["qa_pairs"].append({"question": last_q, "answer": text_clean})
            s["_last_question"] = None
    return s

def record_proctor_event(session_id: str, issue: str, time: Optional[str] = None) -> Dict[str, Any]:
    s = _get_or_create_session(session_id)
    s["proctor_events"].append({"time": time, "issue": issue})
    return s

def get_session_data(session_id: str) -> Dict[str, Any]:
    return _get_or_create_session(session_id)

class InterviewContextRequest(BaseModel):
    repo_analysis: Optional[Dict[str, Any]] = None
    resume_analysis: Optional[Dict[str, Any]] = None

class InterviewContextResponse(BaseModel):
    context: str
    agent_id: str
    api_key: str
    success: bool

@router.post("/prepare-interview", response_model=InterviewContextResponse)
async def prepare_interview(payload: InterviewContextRequest):
    """
    Generate interview context from repo and resume analysis and update ElevenLabs agent.
    """
    
    context_parts = []
    
    # Build context from Repository Analysis
    if payload.repo_analysis:
        repo = payload.repo_analysis
        context_parts.append("=== CANDIDATE'S PROJECT ANALYSIS ===")
        
        if repo.get("description"):
            context_parts.append(f"Project Description: {repo['description']}")
        
        if repo.get("tech_stack"):
            tech_stack = ", ".join(repo["tech_stack"])
            context_parts.append(f"Technologies Used: {tech_stack}")
        
        if repo.get("features"):
            features = "; ".join(repo["features"][:3])
            context_parts.append(f"Key Features: {features}")
        
        if repo.get("questions_that_can_be_asked_in_interview"):
            context_parts.append("\nProject-Specific Questions to Ask:")
            for i, q in enumerate(repo["questions_that_can_be_asked_in_interview"][:3], 1):
                context_parts.append(f"{i}. {q}")
    
    # Build context from Resume Analysis
    if payload.resume_analysis:
        resume = payload.resume_analysis
        context_parts.append("\n=== CANDIDATE'S RESUME ANALYSIS ===")
        
        if resume.get("key_skills"):
            skills = ", ".join(resume["key_skills"][:5])
            context_parts.append(f"Key Skills: {skills}")
        
        if resume.get("experience"):
            exp_count = len(resume["experience"])
            context_parts.append(f"Years of Experience: {exp_count} roles")
        
        if resume.get("highlights"):
            highlights = "; ".join(resume["highlights"][:2])
            context_parts.append(f"Key Achievements: {highlights}")
    
    # Add Standard Interview Instructions
    context_parts.append("\n=== INTERVIEW GUIDELINES ===")
    context_parts.append("""
You are conducting a technical interview. Follow this structure:
1. Start with a brief introduction and ask the candidate to introduce themselves
2. Ask 2-3 questions about their PROJECT (based on the analysis above)
3. Ask 2-3 questions about their RESUME experience and skills
4. Ask 2-3 FUNDAMENTAL questions on: Data Structures & Algorithms, Computer Networks, DBMS, or OOP
5. End by asking if they have any questions for you

Keep questions concise and conversational. Listen to their answers and ask follow-up questions.
Be professional but friendly. Each question should be asked ONE AT A TIME.
""")
    
    context = "\n".join(context_parts)
    
    # Add explicit instruction at the start of the context
    system_instruction = (
        "You are a technical interviewer named Sarah. "
        "Use the following analysis of the candidate's code and resume to ask them targeted questions. "
        "Do not read the analysis out loud; use it to formulate your questions.\n\n"
    )
    
    # Prepend the instruction
    full_prompt = system_instruction + context
    
    # Get ElevenLabs credentials
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    agent_id = os.getenv("ELEVENLABS_AGENT_ID", "")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    # Update the agent's prompt via ElevenLabs API
    update_success = False
    try:
        url = f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        # Update agent with the custom prompt
        update_data = {
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": full_prompt
                    },
                    "first_message": "Hello! I'm Sinan, your technical interviewer. I've reviewed your project and resume. Let's start - could you briefly introduce yourself?"
                }
            }
        }
        
        response = requests.patch(url, json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Successfully updated agent {agent_id} with custom prompt")
            update_success = True
        else:
            print(f"⚠️ Failed to update agent: {response.status_code} - {response.text}")
            # Don't fail the request, just log it
            
    except Exception as e:
        print(f"⚠️ Error updating agent: {str(e)}")
        # Don't fail the request, proceed anyway
    
    return {
        "context": full_prompt,
        "agent_id": agent_id,
        "api_key": api_key,
        "success": update_success
    }

@router.post("/session/context")
async def save_session_context(payload: SessionContextUpsertRequest):
    session = upsert_session_context(
        session_id=payload.session_id,
        repo_analysis=payload.repo_analysis,
        resume_analysis=payload.resume_analysis,
        job_description=payload.job_description,
        skills_needed=payload.skills_needed,
    )
    return {"ok": True, "session_id": payload.session_id, "has_repo": bool(session.get("repo_analysis")), "has_resume": bool(session.get("resume_analysis"))}

@router.post("/session/turn")
async def save_interview_turn(payload: InterviewTurnIngestRequest):
    session = record_interview_turn(payload.session_id, payload.role, payload.text)
    return {"ok": True, "session_id": payload.session_id, "transcript_count": len(session["transcript"]), "qa_count": len(session["qa_pairs"])}

@router.get("/session/{session_id}")
async def read_session_data(session_id: str):
    return get_session_data(session_id)