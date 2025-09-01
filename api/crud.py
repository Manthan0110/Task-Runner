from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import Task, Run, DeadLetterQueue
from schemas import TaskCreate
from utils import encrypt_headers

def get_tasks(db: Session, limit: int = 50, offset: int = 0) -> List[Task]:
    return db.query(Task).order_by(Task.id).limit(limit).offset(offset).all()

def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()

def get_runs_for_task(db: Session, task_id: int, limit: int = 100, offset: int = 0) -> List[Run]:
    return (
        db.query(Run)
        .filter(Run.task_id == task_id)
        .order_by(desc(Run.created_at))
        .limit(limit)
        .offset(offset)
        .all()
    )

def get_dlq_for_task(db: Session, task_id: int, limit: int = 100, offset: int = 0) -> List[DeadLetterQueue]:
    return (
        db.query(DeadLetterQueue)
        .filter(DeadLetterQueue.task_id == task_id)
        .order_by(desc(DeadLetterQueue.created_at))
        .limit(limit)
        .offset(offset)
        .all()
    )

def delete_dlq(db: Session, dlq_id: int) -> bool:
    row = db.query(DeadLetterQueue).filter(DeadLetterQueue.id == dlq_id).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def create_task(db: Session, user_id: str, task_in: TaskCreate) -> Task:
    headers_enc = None
    if task_in.headers:
        headers_enc = encrypt_headers(task_in.headers)
    db_task = Task(
        user_id=user_id,
        url=task_in.url,
        method=task_in.method.upper(),
        headers_encrypted=headers_enc,
        body=task_in.body,
        schedule_cron=task_in.schedule_cron,
        enabled=task_in.enabled,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(
    db: Session,
    task_id: int,
    *,
    url: Optional[str] = None,
    method: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    body: Optional[str] = None,
    schedule_cron: Optional[str] = None,
    enabled: Optional[bool] = None,
) -> Optional[Task]:
    task = get_task(db, task_id)
    if not task:
        return None
    if url is not None:
        task.url = url
    if method is not None:
        task.method = method.upper()
    if headers is not None:
        task.headers_encrypted = encrypt_headers(headers) if headers else None
    if body is not None:
        task.body = body
    if schedule_cron is not None:
        task.schedule_cron = schedule_cron
    if enabled is not None:
        task.enabled = enabled
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: int) -> bool:
    task = get_task(db, task_id)
    if not task:
        return False
    db.query(Run).filter(Run.task_id == task_id).delete()
    db.query(DeadLetterQueue).filter(DeadLetterQueue.task_id == task_id).delete()
    db.delete(task)
    db.commit()
    return True
