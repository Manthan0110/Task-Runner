from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import crud
import schemas
from models import Run
from worker import execute_task  # reuse the worker's HTTP executor

router = APIRouter()

# GET /tasks
@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    return crud.get_tasks(db, limit=limit, offset=offset)

# POST /tasks
@router.post("/", response_model=schemas.TaskOut)
def create_task(task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db, user_id="dev_user", task_in=task_in)

# GET /tasks/{task_id}
@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# PATCH /tasks/{task_id}
@router.patch("/{task_id}", response_model=schemas.TaskOut)
def patch_task(task_id: int, task_upd: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = crud.update_task(
        db,
        task_id,
        url=task_upd.url,
        method=task_upd.method,
        headers=task_upd.headers,
        body=task_upd.body,
        schedule_cron=task_upd.schedule_cron,
        enabled=task_upd.enabled,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# DELETE /tasks/{task_id}
@router.delete("/{task_id}")
def remove_task(task_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_task(db, task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}

# GET /tasks/{task_id}/runs
@router.get("/{task_id}/runs", response_model=List[schemas.RunOut])
def list_runs(task_id: int, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_runs_for_task(db, task_id=task_id, limit=limit, offset=offset)

# GET /tasks/{task_id}/dlq
@router.get("/{task_id}/dlq", response_model=List[schemas.DLQOut])
def list_dlq(task_id: int, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_dlq_for_task(db, task_id=task_id, limit=limit, offset=offset)

# POST /tasks/{task_id}/dlq/{dlq_id}/replay  -> run immediately and remove from DLQ
@router.post("/{task_id}/dlq/{dlq_id}/replay")
def replay_dlq(task_id: int, dlq_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Execute once now (same logic as worker HTTP call)
    ok, latency, code, err = execute_task(task)
    r = Run(
        task_id=task.id,
        status="success" if ok else "failure",
        latency_ms=latency,
        response_code=code,
        error=err,
    )
    db.add(r)
    # remove DLQ row regardless of outcome (or keep if you prefer)
    crud.delete_dlq(db, dlq_id)
    db.commit()
    return {"ok": ok, "response_code": code, "error": err, "latency_ms": latency}

from fastapi import Body

@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = crud.update_task(db, task_id=task_id, task_in=task_in)
    return task


@router.get("/{task_id}/dlq")
def list_dlq(task_id: int, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_dlq_for_task(db, task_id=task_id, limit=limit, offset=offset)


@router.post("/{task_id}/dlq/{dlq_id}/replay")
def replay_dlq(task_id: int, dlq_id: int, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    ok = crud.replay_from_dlq(db, task_id=task_id, dlq_id=dlq_id)
    if not ok:
        raise HTTPException(status_code=404, detail="DLQ entry not found")
    return {"ok": True}
