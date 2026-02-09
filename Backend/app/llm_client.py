import os
import json
from typing import Any, Dict
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL")

SYSTEM_PROMPT = (
    "You are a senior software analyst. Return only strict JSON."
)

USER_PROMPT_TEMPLATE = """Analyze the following frontend source code and return strict JSON with:
- description: project purpose plus application flow and user types
- features: array of main features
- tech_stack: A comprehensive array of ALL technologies used. You MUST explicitly look for and include:
    * Programming Languages (e.g., Python, JavaScript, TypeScript)
    * Frameworks (e.g., React, Next.js, Vue, FastAPI, Django)
    * State Management (e.g., Redux, Context API, Zustand)
    * API Fetching & Async tools (e.g., Axios, fetch, TanStack Query, SWR)
    * Styling & UI Libraries (e.g., f\ Material UI, Bootstrap, CSS Modules)
    * Build tools (e.g., Vite, Webpack)
    * Any other major libraries found in imports or configuration.
- questions_that_can_be_asked_in_interview: array of 5 technical interview questions specifically related to the code patterns, libraries, and architecture used in this project.
- summary: overall summary

Source code:
{source}
"""

RESUME_PROMPT_TEMPLATE = """Analyze the following candidate resume text and return strict JSON with:
- description: brief profile summary.
- key_skills: array of technical and soft skills.
- key_projects: array of projects with brief descriptions.
- experience: array of work experience entries (e.g. "Software Engineer at Google (2020-2022): Developed X...").
- education: array of education entries.
- highlights: array of key achievements.

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
        # Fallback empty structure to prevent 500 crashes
        print(f"JSON Parse Error. Raw text: {text}")
        return {
            "description": "Error analyzing resume content.",
            "key_skills": [],
            "highlights": []
        }

async def analyze_source_with_llm(source: str) -> Dict[str, Any]:
    if not LLM_API_KEY:
        raise RuntimeError("LLM_API_KEY is not set")
    
    genai.configure(api_key=LLM_API_KEY)
    model = genai.GenerativeModel(LLM_MODEL)
    
    prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(source=source)}"
    
    try:
        response = await model.generate_content_async(prompt)
        
        # Check if response was blocked by safety filters
        if not response.text:
            raise RuntimeError("LLM response was empty or blocked by safety filters")
            
        return _extract_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {str(e)}")

async def analyze_resume_with_llm(resume_text: str) -> Dict[str, Any]:
    if not LLM_API_KEY:
        raise RuntimeError("LLM_API_KEY is not set")
    
    genai.configure(api_key=LLM_API_KEY)
    model = genai.GenerativeModel(LLM_MODEL)
    
    prompt = f"{SYSTEM_PROMPT}\n\n{RESUME_PROMPT_TEMPLATE.format(resume_text=resume_text)}"
    
    try:
        response = await model.generate_content_async(prompt)
        
        # Check if response was blocked by safety filters
        if not response.text:
            raise RuntimeError("LLM response was empty or blocked by safety filters")
            
        return _extract_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {str(e)}")