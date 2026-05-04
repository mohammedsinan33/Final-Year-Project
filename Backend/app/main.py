from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import asyncio

from app.routes import recruiter
from app.routes.analyze import router as analyze_router
from app.routes.proctor import router as proctor_router
from app.routes.interview import router as interview_router
from app.routes.finalreport import router as finalreport_router
from app.routes.applications import router as applications_router
from app.utils.scheduler import (
    send_pending_application_received_emails,
    send_pending_shortlist_emails,
    send_pending_interview_confirmation_emails,
    send_pending_project_submission_emails,
    send_pending_project_analysis,
    send_pending_alignment_score_emails,
    send_pending_interview_links,  # ← ADD THIS LINE
)

# Background job wrapper (thread-safe)
def email_scheduler_job():
    """Wrapper to run async functions in a separate event loop"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Run all email and analysis jobs
        loop.run_until_complete(send_pending_project_analysis())
        loop.run_until_complete(send_pending_alignment_score_emails())  # ADD THIS LINE
        loop.run_until_complete(send_pending_application_received_emails())
        loop.run_until_complete(send_pending_shortlist_emails())
        loop.run_until_complete(send_pending_interview_confirmation_emails())
        loop.run_until_complete(send_pending_interview_links())  # ADD THIS LINE
        
        loop.close()
    except Exception as e:
        print(f"❌ Scheduler error: {str(e)}")
        import traceback
        traceback.print_exc()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        email_scheduler_job,
        'interval',
        minutes=1,
        id='send_emails_job',
        name='Send all pending emails every minute',
        replace_existing=True
    )
    scheduler.start()
    print("✓ Email scheduler started (checks every 1 minute)")
    print("  - Application received emails")
    print("  - Shortlist/rejection emails")
    print("  - Interview confirmation emails")
    print("  - Project submission emails")
    print("  - Project analysis emails")
    print("  - Interview links")  # ← ADD THIS LINE
    
    yield
    
    scheduler.shutdown(wait=True)
    print("✓ Email scheduler stopped")

app = FastAPI(title="Continental AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(proctor_router, prefix="/proctor", tags=["proctor"])
app.include_router(interview_router, prefix="/interview", tags=["interview"])
app.include_router(finalreport_router, prefix="/final-report", tags=["final-report"])
app.include_router(applications_router)
app.include_router(recruiter.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
