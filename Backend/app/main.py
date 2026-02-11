from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router
from app.routes.proctor import router as proctor_router  # Import the new router

app = FastAPI(title="Repo Analyzer")

# Allow all origins to prevent CORS errors during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(proctor_router, prefix="/proctor", tags=["proctor"]) # Register it