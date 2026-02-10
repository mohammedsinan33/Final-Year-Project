import os
import json
from typing import Any, Dict, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.0-flash")

SYSTEM_PROMPT = (
    "You are a senior technical recruiter and software architect. Return only strict JSON."
)

USER_PROMPT_TEMPLATE = """Analyze the following frontend source code and return strict JSON with:
- description: project purpose plus application flow and user types
- features: array of main features
- tech_stack: A comprehensive array of ALL technologies used.
- questions_that_can_be_asked_in_interview: array of 5 technical interview questions.
- summary: overall summary
- alignment_score: (Integer 0-100) How well does the code match the "Desired Project Description" provided below? (If no desired description is provided, return 0).
- alignment_summary: A short paragraph explaining the score. Does the code implement what was described? What is missing or different?

Desired Project Description:
{project_desc}

Source code:
{source}
"""

RESUME_PROMPT_TEMPLATE = """Analyze the following candidate resume text and return strict JSON with:
- description: brief profile summary.
- key_skills: array of technical and soft skills.
- key_projects: array of projects with brief descriptions.
- experience: array of work experience entries.
- education: array of education entries.
- highlights: array of key achievements.
- match_score: (Integer 0-100) How well does this resume match the "Target Job Description" and "Required Skills" provided below? 
    * If no job description is provided, return 0.
    * 0-40: Poor match (Missing key skills/experience)
    * 41-70: Good match (Has most skills but lacks specific experience)
    * 71-100: Excellent match (Perfect fit)
- match_summary: A short paragraph explaining the score. Why is this candidate a good or bad fit for THIS specific job? Mention missing critical skills if any.

Target Job Description:
{job_desc}

Required Skills:
{skills_needed}

Resume text:
{resume_text}
"""

def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        print(f"JSON Parse Error. Raw text: {text}")
        return {
            "description": "Error parsing LLM response.",
            "features": [],
            "tech_stack": [],
            "summary": "Error",
            "alignment_score": 0,
            "alignment_summary": "Error parsing alignment.",
            "match_score": 0,
            "match_summary": "Error parsing score."
        }

async def analyze_source_with_llm(source: str, project_desc: Optional[str] = "") -> Dict[str, Any]:
    if not LLM_API_KEY:
        raise RuntimeError("LLM_API_KEY is not set")
    
    genai.configure(api_key=LLM_API_KEY)
    model = genai.GenerativeModel(LLM_MODEL)
    
    # Handle empty description
    desc_text = project_desc if project_desc and project_desc.strip() else "No description provided."
    
    prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(source=source, project_desc=desc_text)}"
    
    try:
        response = await model.generate_content_async(prompt)
        return _extract_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {str(e)}")

async def analyze_resume_with_llm(
    resume_text: str, 
    job_desc: Optional[str] = "", 
    skills_needed: Optional[str] = ""
) -> Dict[str, Any]:
    if not LLM_API_KEY:
        raise RuntimeError("LLM_API_KEY is not set")
    
    genai.configure(api_key=LLM_API_KEY)
    model = genai.GenerativeModel(LLM_MODEL)

    job_text = job_desc if job_desc and job_desc.strip() else "No job description provided."
    skills_text = skills_needed if skills_needed and skills_needed.strip() else "No specific skills listed."
    
    prompt = f"{SYSTEM_PROMPT}\n\n{RESUME_PROMPT_TEMPLATE.format(resume_text=resume_text, job_desc=job_text, skills_needed=skills_text)}"
    
    try:
        response = await model.generate_content_async(prompt)
        return _extract_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {str(e)}")