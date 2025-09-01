# worker.py
import logging
import time
import threading
from datetime import datetime
from croniter import croniter
import requests
from database import SessionLocal
from models import Task, Run, DeadLetterQueue
from utils import decrypt_headers

logger = logging.getLogger(__name__)

_worker_started = False


def execute_task(task):
    """Make the HTTP request defined by the task."""
    headers = {}
    raw = getattr(task, "headers_encrypted", None)
    if isinstance(raw, str) and raw.strip():
        try:
            headers = decrypt_headers(raw)
        except Exception as e:
            logger.error(f"Header decrypt failed: {e}")
            headers = {}

    start = time.time()
    try:
        resp = requests.request(task.method, task.url, headers=headers, data=task.body, timeout=10)
        latency = int((time.time() - start) * 1000)
        return True, latency, resp.status_code, None
    except Exception as e:
        return False, 0, 0, str(e)


def run_with_retries(db, task, max_retries=3, backoff_seconds=(1, 2, 4), _execute=execute_task):
    """Execute a task with retries and DLQ fallback."""
    attempts = 0
    last_error = None
    while attempts <= max_retries:
        attempts += 1
        ok, latency, code, err = _execute(task)

        db.add(Run(
            task_id=task.id,
            status="success" if ok else "failure",
            latency_ms=latency,
            response_code=code,
            error=err
        ))
        db.commit()

        if ok:
            logger.info(f"✅ Task {task.id} succeeded (code={code}, latency={latency}ms)")
            return True

        last_error = err
        if attempts <= max_retries:
            sleep_for = backoff_seconds[min(attempts - 1, len(backoff_seconds) - 1)]
            logger.warning(f"⚠️ Task {task.id} failed (attempt {attempts}), retrying in {sleep_for}s...")
            time.sleep(sleep_for)

    # exhausted retries → move to DLQ
    db.add(DeadLetterQueue(task_id=task.id, error=last_error or "unknown"))
    db.commit()
    logger.error(f"❌ Task {task.id} moved to DLQ: {last_error}")
    return False


def seed_tasks(db):
    """Auto-create demo tasks if DB is empty."""
    existing = db.query(Task).count()
    if existing == 0:
        logger.info("🌱 Seeding demo tasks...")
        demo_tasks = [
            Task(
                user_id="system",
                url="https://httpbin.org/get",
                method="GET",
                schedule_cron="*/1 * * * *",  # every 1 min
                enabled=True
            ),
            Task(
                user_id="system",
                url="https://httpbin.org/status/401",
                method="GET",
                schedule_cron="*/1 * * * *",  # every 1 min
                enabled=True
            ),
        ]
        db.add_all(demo_tasks)
        db.commit()
        logger.info("✅ Demo tasks created: 2")


def worker_loop(poll_interval: int = 5):
    logger.info("🔄 Worker started (poll interval: %ss)", poll_interval)
    while True:
        db = SessionLocal()
        try:
            # ✅ ensure demo tasks exist
            seed_tasks(db)

            tasks = db.query(Task).filter(Task.enabled == True).all()
            now = datetime.utcnow()

            for task in tasks:
                if not task.schedule_cron:
                    continue

                # last run time
                last = db.query(Run).filter(Run.task_id == task.id).order_by(Run.created_at.desc()).first()
                base = last.created_at if last else task.created_at

                try:
                    itr = croniter(task.schedule_cron, base)
                    next_run = itr.get_next(datetime)
                except Exception:
                    continue

                if next_run <= now:
                    run_with_retries(db, task, max_retries=3)
        except Exception as e:
            logger.exception("Worker error: %s", e)
        finally:
            db.close()

        time.sleep(poll_interval)


def start_worker_background():
    """Start the worker once (avoid duplicates under reload)."""
    global _worker_started
    if _worker_started:
        return
    t = threading.Thread(target=worker_loop, kwargs={"poll_interval": 5}, daemon=True)
    t.start()
    _worker_started = True
