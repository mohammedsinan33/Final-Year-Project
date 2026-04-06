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
    application_id: Optional[str] = None  # ADD THIS LINE

class InterviewContextResponse(BaseModel):
    context: str
    agent_id: str
    api_key: str
    success: bool
    session_id: Optional[str] = None  # ADD THIS

@router.post("/prepare-interview", response_model=InterviewContextResponse)
async def prepare_interview(payload: InterviewContextRequest):
    """
    Generate interview context from repo and resume analysis and update ElevenLabs agent.
    Can fetch data from job_applications table if application_id is provided.
    """
    
    # Helper function to ensure data is a list
    def as_list(value):
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [value]
        return []
    
    repo = {}
    resume = {}
    
    # Fetch from job_applications table if application_id provided
    if payload.application_id:
        try:
            from supabase import create_client
            
            sb_url = os.getenv("SUPABASE_URL", "").strip()
            sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
            
            if not sb_url or not sb_key:
                raise HTTPException(status_code=500, detail="Supabase credentials missing")
            
            supabase = create_client(sb_url, sb_key)
            
            # Fetch the specific application's data
            result = supabase.table("job_applications").select(
                "project_description_analyzed,"
                "project_features,"
                "project_tech_stack,"
                "project_interview_questions,"
                "key_skills,"
                "experience,"
                "highlights"
            ).eq("id", payload.application_id).single().execute()
            
            if result.data:
                app_row = result.data
                
                # Map job_applications columns to repo structure
                repo = {
                    "description": app_row.get("project_description_analyzed"),
                    "tech_stack": as_list(app_row.get("project_tech_stack")),
                    "features": as_list(app_row.get("project_features")),
                    "questions_that_can_be_asked_in_interview": as_list(app_row.get("project_interview_questions")),
                }
                
                # Map job_applications columns to resume structure
                resume = {
                    "key_skills": as_list(app_row.get("key_skills")),
                    "experience": as_list(app_row.get("experience")),
                    "highlights": as_list(app_row.get("highlights")),
                }
        except Exception as e:
            print(f"⚠️ Error fetching application data: {str(e)}")
            # Fall back to payload data
            repo = payload.repo_analysis or {}
            resume = payload.resume_analysis or {}
    else:
        # Use payload data if no application_id provided
        repo = payload.repo_analysis or {}
        resume = payload.resume_analysis or {}
    
    context_parts = []
    
    # Build context from Repository Analysis - ONLY if project data exists
    has_project_data = bool(
        repo.get("description") or 
        repo.get("tech_stack") or 
        repo.get("features") or 
        repo.get("questions_that_can_be_asked_in_interview")
    )

    if has_project_data:
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
    if resume:
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
    
    # Add Standard Interview Instructions (adaptive based on project)
    context_parts.append("\n=== INTERVIEW GUIDELINES ===")

    if has_project_data:
        guidelines = """
You are conducting a technical interview. Follow this structure:
1. Start with a brief introduction and ask the candidate to introduce themselves
2. Ask 2-3 questions about their PROJECT (based on the analysis above)
3. Ask 2-3 questions about their RESUME experience and skills
4. Ask 2-3 FUNDAMENTAL questions on: Data Structures & Algorithms, Computer Networks, DBMS, or OOP
5. End by asking if they have any questions for you

Keep questions concise and conversational. Listen to their answers and ask follow-up questions.
Be professional but friendly. Each question should be asked ONE AT A TIME.
"""
    else:
        guidelines = """
You are conducting a technical interview (Resume & Skills focused). Follow this structure:
1. Start with a brief introduction and ask the candidate to introduce themselves
2. Ask 3-4 questions about their RESUME experience and technical skills (based on the analysis above)
3. Ask 2-3 FUNDAMENTAL questions on: Data Structures & Algorithms, Computer Networks, DBMS, or OOP
4. Ask 1-2 questions about their career goals and what they're looking for
5. End by asking if they have any questions for you

Keep questions concise and conversational. Listen to their answers and ask follow-up questions.
Be professional but friendly. Each question should be asked ONE AT A TIME.
"""

    context_parts.append(guidelines)
    context = "\n".join(context_parts)
    
    # IMPORTANT: Store context in session for THIS interview
    # The session_id will be sent from frontend and used to retrieve this context
    session_id = f"interview_{payload.application_id}_{int(__import__('time').time() * 1000)}"
    
    upsert_session_context(
        session_id=session_id,
        repo_analysis=repo,
        resume_analysis=resume
    )
    
    # Add explicit instruction at the start of the context
    system_instruction = f"""You are a technical interviewer named Sarah.

⚠️ IMPORTANT - FRESH INTERVIEW SESSION:
- This is a COMPLETELY NEW interview with a NEW candidate
- You have NO previous conversation history with this candidate
- Do NOT ask questions you asked before in other interviews
- Ask ORIGINAL, VARIED, and THOUGHTFUL questions
- Focus ONLY on THIS candidate's specific project and resume
- Keep track of what you've asked in THIS conversation and avoid repetition

Your approach:
1. Ask unique, specific questions about their code and approach
2. Dig deeper into their architectural decisions, not just surface features
3. Explore edge cases, error handling, and design trade-offs
4. Listen carefully to their answers before asking follow-ups
5. Ask each question ONE AT A TIME and wait for their full response

Session ID (for reference): {session_id}
Use the following analysis to formulate targeted, original questions.
Do not read the analysis out loud; use it to guide your questioning.
"""
    
    full_prompt = system_instruction + context
    
    # Get ElevenLabs credentials
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    agent_id = os.getenv("ELEVENLABS_AGENT_ID", "")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    print(f"✅ Stored context for session: {session_id}")
    print(f"📋 Context:\n{full_prompt}")
    
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
                    "first_message": "Hello! I'm Sarah, your technical interviewer. I've reviewed your profile. Let's start with introductions - could you briefly tell me about yourself and your background?"
                }
            }
        }
        
        response = requests.patch(url, json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Successfully updated agent {agent_id} with custom prompt")
            update_success = True
        else:
            print(f"⚠️ Failed to update agent: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"⚠️ Error updating agent: {str(e)}")
    
    return {
        "context": full_prompt,
        "agent_id": agent_id,
        "api_key": api_key,
        "success": update_success,
        "session_id": session_id
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