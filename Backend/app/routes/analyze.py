from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.schemas import AnalyzeRequest, AnalyzeResponse, ResumeResponse
from app.utils.repo import clone_repo, find_src_dir, read_source_files
from app.utils.resume import extract_resume_text
from app.llm_client import analyze_source_with_llm, analyze_resume_with_llm
import tempfile
import traceback

router = APIRouter()

@router.post("/analyze-repo", response_model=AnalyzeResponse)
async def analyze_repo(payload: AnalyzeRequest):
    if not payload.repo_url:
        raise HTTPException(status_code=400, detail="repo_url is required")

    repo_url_str = str(payload.repo_url)

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            repo_path = clone_repo(repo_url_str, tmpdir)
            src_path = find_src_dir(repo_path)
            combined_source = read_source_files(src_path)
        except Exception as e:
            print(f"Repo Error: {e}")
            raise HTTPException(status_code=400, detail=f"Repo Error: {str(e)}")

        try:
            result = await analyze_source_with_llm(
                combined_source, 
                project_desc=payload.project_desc
            )
            return result
        except Exception as e:
            print(f"LLM Error: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")


@router.post("/analyze-resume", response_model=ResumeResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    job_desc: Optional[str] = Form(None),
    skills_needed: Optional[str] = Form(None)
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")
            
        resume_text = extract_resume_text(content, file.filename)
        
        if not resume_text:
             raise HTTPException(status_code=400, detail="Text extraction failed")

        result = await analyze_resume_with_llm(
            resume_text, 
            job_desc=job_desc, 
            skills_needed=skills_needed
        )
        return result
    except Exception as e:
         print(f"Resume Error: {e}")
         traceback.print_exc()
         raise HTTPException(status_code=500, detail=str(e))