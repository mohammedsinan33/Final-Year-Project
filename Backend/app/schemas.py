from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Union, Dict, Any

class AnalyzeRequest(BaseModel):
    repo_url: HttpUrl
    project_type: Optional[str] = None
    project_desc: Optional[str] = None

class AnalyzeResponse(BaseModel):
    description: Optional[str] = "No description available"
    features: List[str] = Field(default_factory=list)
    tech_stack: List[str] = Field(default_factory=list)
    questions_that_can_be_asked_in_interview: List[str] = Field(default_factory=list)
    summary: Optional[str] = "No summary available"
    alignment_score: Optional[int] = 0
    alignment_summary: Optional[str] = "No alignment checked."

class ProjectItem(BaseModel):
    name: Optional[str] = ""
    description: Optional[str] = ""

class ResumeResponse(BaseModel):
    description: Optional[str] = "No profile summary available"
    key_skills: List[str] = Field(default_factory=list)
    key_projects: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    experience: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    education: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    match_score: Optional[int] = 0
    match_summary: Optional[str] = "No job description provided for matching."

class InterviewTurn(BaseModel):
    role: str
    text: str

class QAPair(BaseModel):
    question: str
    answer: str

class SessionContextUpsertRequest(BaseModel):
    session_id: str
    repo_analysis: Optional[Dict[str, Any]] = None
    resume_analysis: Optional[Dict[str, Any]] = None
    job_description: Optional[str] = ""
    skills_needed: Optional[str] = ""

class InterviewTurnIngestRequest(BaseModel):
    session_id: str
    role: str
    text: str

class InterviewEvaluationRequest(BaseModel):
    session_id: str
    transcript: List[InterviewTurn] = Field(default_factory=list)
    interview_qa_pairs: List[QAPair] = Field(default_factory=list)
    proctor_events: List[Dict[str, Any]] = Field(default_factory=list)
    job_description: Optional[str] = ""
    skills_needed: Optional[str] = ""
    repo_analysis: Optional[Dict[str, Any]] = None
    resume_analysis: Optional[Dict[str, Any]] = None

class InterviewEvaluationResponse(BaseModel):
    session_id: str
    evaluation: Dict[str, Any]