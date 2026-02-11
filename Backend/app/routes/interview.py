from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

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
                    "first_message": "Hello! I'm Sarah, your technical interviewer. I've reviewed your project and resume. Let's start - could you briefly introduce yourself?"
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