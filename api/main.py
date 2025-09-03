import os
from fastapi import FastAPI
from database import engine
from sqlalchemy.orm import Session
from database import get_db
from fastapi import Depends, HTTPException
from models import Base
from routers import tasks
from seeds import seed
import seeds.seed as seeder
# import asyncio  # not needed anymore, but safe to keep if you want
from worker import start_worker_background
app = FastAPI()
Base.metadata.create_all(bind=engine)

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

from fastapi.middleware.cors import CORSMiddleware


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://task-runner.netlify.app",
    ],
    allow_origin_regex=None,      # set to r".*" only for quick debugging (not for prod)
    allow_credentials=True,
    allow_methods=["*"],          # <-- lets OPTIONS/POST/GET/etc through
    allow_headers=["*"],          # <-- lets custom headers through
    max_age=600,                  # cache preflight (optional)
)

from routers import analytics
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.on_event("startup")
async def startup():
    if os.getenv("DISABLE_WORKER") == "1":
        return
    # No loop argument needed for start_worker_background
    start_worker_background()

@app.post("/seed")
def seed_database():
    try:
        seed.run_seed()   # ✅ now it exists
        return {"status": "Database seeded successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")

@app.get("/")
def root():
    return {"message": "Webhook Runner API running with worker!"}

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/health")
def health():
    return {"status": "ok"}
