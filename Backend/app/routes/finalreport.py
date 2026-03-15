from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.llm_client import generate_final_report_with_llm
from app.routes.interview import get_session_data

router = APIRouter()


class TranscriptTurn(BaseModel):
    role: str
    text: str


class ProctorEvent(BaseModel):
    time: Optional[str] = None
    issue: str


class FinalReportRequest(BaseModel):
    session_id: str
    transcript: List[TranscriptTurn] = Field(default_factory=list)
    qa_pairs: Optional[List[Dict[str, str]]] = None
    proctor_events: List[ProctorEvent] = Field(default_factory=list)
    interview_context: Optional[Dict[str, Any]] = None


class FinalReportResponse(BaseModel):
    session_id: str
    report: Dict[str, Any]


def _build_fallback_report(
    qa_pairs: List[Dict[str, str]],
    proctor_events: List[ProctorEvent],
    context: Dict[str, Any],
) -> Dict[str, Any]:
    answered = sum(1 for pair in qa_pairs if (pair.get("answer") or "").strip())
    total = len(qa_pairs)
    qa_match_score = int((answered / total) * 100) if total else 0

    proctor_issue_count = len(proctor_events)
    # Conservative heuristic: each alert contributes 10% risk, capped at 100.
    proctor_issues_percent = min(100, proctor_issue_count * 10)
    proctoring_score = max(0, 100 - proctor_issues_percent)
    proctoring_status = "acceptable" if proctor_issues_percent <= 20 else "concern"

    tech_seed = 50 if total > 0 else 35
    technical_score = min(100, tech_seed + int(qa_match_score * 0.4))
    communication_score = min(100, 45 + int(qa_match_score * 0.45))

    overall_score = int((technical_score * 0.4) + (communication_score * 0.35) + (proctoring_score * 0.25))

    if overall_score >= 80:
        suitability_level = "Strong Yes"
    elif overall_score >= 65:
        suitability_level = "Yes"
    elif overall_score >= 50:
        suitability_level = "Borderline"
    else:
        suitability_level = "No"

    suitable = suitability_level in ("Strong Yes", "Yes")

    repo_analysis = context.get("repo_analysis") or {}
    resume_analysis = context.get("resume_analysis") or {}
    matched_skills = (resume_analysis.get("key_skills") or [])[:8]

    strengths: List[str] = []
    if qa_match_score >= 70:
        strengths.append("Answered most interview questions with usable responses.")
    if proctoring_status == "acceptable":
        strengths.append("Proctoring behavior remained within acceptable threshold.")
    if repo_analysis.get("tech_stack"):
        strengths.append("Demonstrated project exposure across the listed tech stack.")
    if not strengths:
        strengths.append("Candidate completed interview flow and submitted responses.")

    improvement_areas: List[str] = []
    if qa_match_score < 60:
        improvement_areas.append("Improve depth and completeness of technical answers.")
    if proctoring_status == "concern":
        improvement_areas.append("Reduce proctoring alerts and maintain exam discipline.")
    if not matched_skills:
        improvement_areas.append("Provide clearer evidence of role-specific skills in interview/resume.")

    final_summary = (
        "Generated fallback report because LLM response was unavailable. "
        f"Overall performance is {overall_score}% with proctoring marked as {proctoring_status}."
    )

    return {
        "overall_score": overall_score,
        "qa_match_score": qa_match_score,
        "technical_score": technical_score,
        "communication_score": communication_score,
        "proctoring_score": proctoring_score,
        "proctor_issues_percent": proctor_issues_percent,
        "proctoring_status": proctoring_status,
        "suitable": suitable,
        "suitability_level": suitability_level,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
        "matched_skills": matched_skills,
        "missing_skills": [],
        "final_summary": final_summary,
    }


def _build_qa_pairs(transcript: List[TranscriptTurn]) -> List[Dict[str, str]]:
    pairs: List[Dict[str, str]] = []
    current_q: Optional[str] = None

    for turn in transcript:
        role = (turn.role or "").lower().strip()
        text = (turn.text or "").strip()
        if not text:
            continue

        if role in ("agent", "ai", "assistant"):
            current_q = text
        elif role in ("candidate", "user", "human"):
            if current_q:
                pairs.append({"question": current_q, "answer": text})
                current_q = None

    return pairs


@router.post("/generate", response_model=FinalReportResponse)
async def generate_final_report(payload: FinalReportRequest):
    try:
        session_data = get_session_data(payload.session_id)

        context_from_session = {
            "job_description": session_data.get("job_description", ""),
            "skills_needed": session_data.get("skills_needed", ""),
            "repo_analysis": session_data.get("repo_analysis", {}),
            "resume_analysis": session_data.get("resume_analysis", {}),
        }
        context = {**context_from_session, **(payload.interview_context or {})}

        transcript_items = payload.transcript or [TranscriptTurn(**t) for t in session_data.get("transcript", [])]
        qa_pairs = payload.qa_pairs or session_data.get("qa_pairs") or _build_qa_pairs(transcript_items)
        proctor_items = payload.proctor_events or [ProctorEvent(**p) for p in session_data.get("proctor_events", [])]

        llm_payload = {
            "session_id": payload.session_id,
            "qa_pairs": qa_pairs,
            "transcript": [t.model_dump() for t in transcript_items],
            "proctor_events": [p.model_dump() for p in proctor_items],
            "job_description": context.get("job_description", ""),
            "skills_needed": context.get("skills_needed", ""),
            "repo_analysis": context.get("repo_analysis", {}),
            "resume_analysis": context.get("resume_analysis", {}),
        }

        try:
            report = await generate_final_report_with_llm(llm_payload)
        except Exception as llm_error:
            print(f"Final report LLM failed. Falling back to heuristic report: {llm_error}")
            report = _build_fallback_report(qa_pairs, proctor_items, context)

        return {"session_id": payload.session_id, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Final report generation failed: {str(e)}")