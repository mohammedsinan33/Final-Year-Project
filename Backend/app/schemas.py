from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Union, Dict, Any

class AnalyzeRequest(BaseModel):
    repo_url: HttpUrl
    project_type: Optional[str] = None
    project_desc: Optional[str] = None

class AnalyzeResponse(BaseModel):
    description: Optional[str] = "No description available"
    features: Optional[List[str]] = []
    tech_stack: Optional[List[str]] = []
    questions_that_can_be_asked_in_interview: Optional[List[str]] = []
    summary: Optional[str] = "No summary available"
    
    alignment_score: Optional[int] = 0
    alignment_summary: Optional[str] = "No alignment checked."

class ProjectItem(BaseModel):
    name: Optional[str] = ""
    description: Optional[str] = ""

class ResumeResponse(BaseModel):
    description: Optional[str] = "No profile summary available"
    key_skills: Optional[List[str]] = []
    key_projects: Optional[List[Union[str, Dict[str, Any]]]] = []
    experience: Optional[List[Union[str, Dict[str, Any]]]] = []
    education: Optional[List[Union[str, Dict[str, Any]]]] = []
    highlights: Optional[List[str]] = []
    
    match_score: Optional[int] = 0
    match_summary: Optional[str] = "No job description provided for matching."