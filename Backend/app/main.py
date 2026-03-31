from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router
from app.routes.proctor import router as proctor_router
from app.routes.interview import router as interview_router
from app.routes.finalreport import router as finalreport_router
from app.routes.applications import router as applications_router

app = FastAPI(title="Repo Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router) # No prefix here!
app.include_router(proctor_router, prefix="/proctor", tags=["proctor"])
app.include_router(interview_router, prefix="/interview", tags=["interview"])
app.include_router(finalreport_router, prefix="/final-report", tags=["final-report"])
app.include_router(applications_router)