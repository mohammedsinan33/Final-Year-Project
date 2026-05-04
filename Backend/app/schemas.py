from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Union, Dict, Any
from datetime import datetime

# ============================================================================
# EXISTING SCHEMAS
# ============================================================================

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

# ============================================================================
# NEW SCHEMAS FOR INTERVIEW REVIEW & FINAL REPORT
# ============================================================================

class ProctorEvent(BaseModel):
    """Represents a proctoring violation event"""
    time: Optional[str] = None
    issue: str

class ProctoringSummary(BaseModel):
    """Summary of proctoring violations"""
    total_violations: int
    events: List[ProctorEvent] = Field(default_factory=list)

class InterviewReviewRequest(BaseModel):
    """Request to submit interview review"""
    application_id: str
    session_id: str
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback: Optional[str] = ""

class InterviewReviewResponse(BaseModel):
    """Response from interview review submission"""
    ok: bool
    session_id: str
    application_id: str
    message: str
    proctor_violations: int

class ScoreBreakdown(BaseModel):
    """Breakdown of all interview scores"""
    overall: float = Field(0, ge=0, le=100)
    technical: float = Field(0, ge=0, le=100)
    communication: float = Field(0, ge=0, le=100)
    integrity: float = Field(0, ge=0, le=100)
    job_match: float = Field(0, ge=0, le=100)
    experience_match: float = Field(0, ge=0, le=100)
    skills_match: float = Field(0, ge=0, le=100)

class SkillsAssessment(BaseModel):
    """Skills assessment from interview analysis"""
    required: List[str] = Field(default_factory=list)
    demonstrated: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)

class CandidateAssessment(BaseModel):
    """Candidate assessment from interview"""
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    feedback: str = ""

class EligibilityInfo(BaseModel):
    """Eligibility determination"""
    status: str = Field(..., description="Eligible|Not Eligible|Pending Review")
    recommendation: str = Field(..., description="Strong Yes|Yes|Maybe|No")
    reasoning: str = ""

class ProctoringReport(BaseModel):
    """Proctoring violations report"""
    violations: int = 0
    events: List[ProctorEvent] = Field(default_factory=list)

class InterviewReport(BaseModel):
    """Comprehensive interview report"""
    session_id: str
    application_id: str
    position: str
    interview_date: str
    candidate_rating: int
    eligibility: EligibilityInfo
    scores: ScoreBreakdown
    skills: SkillsAssessment
    assessment: CandidateAssessment
    proctoring: ProctoringReport
    audio_analysis: str
    candidate_feedback: str
    database_saved: bool

class FinalReportRequest(BaseModel):
    """Request to generate final report"""
    session_id: str
    application_id: str

class FinalReportResponse(BaseModel):
    """Response with generated final report"""
    ok: bool
    session_id: str
    application_id: str
    report: InterviewReport
    database_saved: bool

class CheckInterviewDataResponse(BaseModel):
    """Response from checking if interview data was saved"""
    ok: bool
    saved: Optional[bool] = False
    rating: Optional[int] = None
    score: Optional[float] = None
    eligibility: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None

class GeminiAnalysisResult(BaseModel):
    """Result from Gemini analysis"""
    technical_score: int = Field(0, ge=0, le=100)
    communication_score: int = Field(0, ge=0, le=100)
    integrity_score: int = Field(0, ge=0, le=100)
    experience_match: int = Field(0, ge=0, le=100)
    skills_match: int = Field(0, ge=0, le=100)
    job_match_score: int = Field(0, ge=0, le=100)
    overall_score: int = Field(0, ge=0, le=100)
    required_skills: List[str] = Field(default_factory=list)
    demonstrated_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    eligibility_status: str = Field("Pending Review")
    eligibility_reasoning: str = ""
    detailed_feedback: str = ""
    hiring_recommendation: str = "Maybe"

class InterviewContextResponse(BaseModel):
    """Response from preparing interview context"""
    context: str
    agent_id: str
    api_key: str
    success: bool
    session_id: Optional[str] = None

class SessionRetrievalResponse(BaseModel):
    """Response from retrieving session data"""
    session_id: str
    transcript: List[InterviewTurn] = Field(default_factory=list)
    qa_pairs: List[QAPair] = Field(default_factory=list)
    proctor_events: List[ProctorEvent] = Field(default_factory=list)
    review: Optional[Dict[str, Any]] = None