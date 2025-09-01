from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Task, Run

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_tasks = db.query(Task).count()
    total_runs = db.query(Run).count()
    successes = db.query(Run).filter(Run.status == "success").count()
    failures = db.query(Run).filter(Run.status == "failure").count()

    # Compute average latency
    latencies = [r.latency_ms for r in db.query(Run.latency_ms).all() if r.latency_ms]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    return {
        "total_tasks": total_tasks,
        "total_runs": total_runs,
        "successes": successes,
        "failures": failures,
        "success_rate": round((successes / total_runs) * 100, 2) if total_runs > 0 else 0,
        "average_latency_ms": round(avg_latency, 2),
    }
