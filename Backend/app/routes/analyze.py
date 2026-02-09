from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas import AnalyzeRequest, AnalyzeResponse, ResumeResponse
from app.utils.repo import clone_repo, find_src_dir, read_source_files, on_rm_error
from app.utils.resume import extract_resume_text
from app.llm_client import analyze_source_with_llm, analyze_resume_with_llm
import tempfile
import shutil
import os

router = APIRouter()

@router.post("/analyze-repo", response_model=AnalyzeResponse)
async def analyze_repo(payload: AnalyzeRequest):
    if not payload.repo_url:
        raise HTTPException(status_code=400, detail="repo_url is required")

    repo_url_str = str(payload.repo_url)
    
    # Use mkdtemp so we can manually control cleanup with our Windows-safe handler
    tmpdir = tempfile.mkdtemp()
    
    try:
        repo_path = clone_repo(repo_url_str, tmpdir)
        src_path = find_src_dir(repo_path)
        combined_source = read_source_files(src_path)
        
        # This is now INSIDE the try block, so errors from LLM are caught
        result = await analyze_source_with_llm(combined_source)
        return result

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        print(f"Internal Server Error: {e}") # Debug log
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
    finally:
        # Clean up safely (handles Windows read-only git files)
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, onerror=on_rm_error)

@router.post("/analyze-resume", response_model=ResumeResponse)
async def analyze_resume(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="resume file is empty")

    resume_text = extract_resume_text(content)
    
    if resume_text.startswith("Error:"):
        raise HTTPException(status_code=400, detail=resume_text)

    if not resume_text:
        raise HTTPException(status_code=400, detail="unable to extract resume text")

    try:
        result = await analyze_resume_with_llm(resume_text)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"LLM Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")