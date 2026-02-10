from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router

app = FastAPI(title="Repo Analyzer")

# Allow all origins to prevent CORS errors during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # THIS MUST BE "*" FOR NOW
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)