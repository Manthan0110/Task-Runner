import os
from fastapi import FastAPI
from database import engine
from models import Base
from routers import tasks
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


@app.post("/seed")
def run_seed(db: Session = Depends(get_db)):
    seeder.run_seed(db)  # wrap your seeding logic in a function
    return {"status": "Database seeded!"}

@app.on_event("startup")
async def startup():
    if os.getenv("DISABLE_WORKER") == "1":
        return
    # No loop argument needed for start_worker_background
    start_worker_background()

@app.get("/")
def root():
    return {"message": "Webhook Runner API running with worker!"}

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/health")
def health():
    return {"status": "ok"}
