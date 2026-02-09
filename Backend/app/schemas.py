from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Union

class AnalyzeRequest(BaseModel):
    repo_url: HttpUrl
    project_type: Optional[str] = None # Added specifically to support frontend passing this

class AnalyzeResponse(BaseModel):
    description: Optional[str] = "No description available"
    features: Optional[List[str]] = []
    tech_stack: Optional[List[str]] = []
    questions_that_can_be_asked_in_interview: Optional[List[str]] = []
    summary: Optional[str] = "No summary available"

class ResumeResponse(BaseModel):
    description: Optional[str] = "No profile summary available"
    key_skills: Optional[List[str]] = []
    key_projects: Optional[List[str]] = []
    experience: Optional[List[str]] = []
    education: Optional[List[str]] = []
    highlights: Optional[List[str]] = []