# seeds/seed.py
import os, random, math, time
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session
from sqlalchemy import text

# allow running as: python seeds/seed.py from the api dir
from database import engine, SessionLocal
from models import Base, Task, Run

BATCH = 200
TOTAL_TASKS = 1000
RUNS_PER_TASK_AVG = 5   # ~ 5k runs total (distributed randomly)

def utcnow():
    return datetime.now(UTC)

def create_tasks(session: Session, start_index=1, end_index=TOTAL_TASKS):
    tasks = []
    for i in range(start_index, end_index + 1):
        # Mix endpoints so we see successes & failures in demo.
        if i % 7 == 0:
            url = "http://127.0.0.1:8000/sometimes-503"
        else:
            url = "http://127.0.0.1:8000/ping"

        t = Task(
            user_id="dev_user",
            url=url,
            method="GET",
            headers_encrypted=None,
            body=None,
            schedule_cron="*/1 * * * *",  # every minute
            enabled=True,
            created_at=utcnow() - timedelta(minutes=random.randint(0, 120))
        )
        tasks.append(t)

        # insert in batches to avoid huge transactions
        if len(tasks) >= BATCH:
            session.add_all(tasks)
            session.commit()
            tasks = []

    if tasks:
        session.add_all(tasks)
        session.commit()

def create_runs(session: Session):
    # get all task IDs
    ids = [id for (id,) in session.execute(text("SELECT id FROM tasks")).all()]
    random.shuffle(ids)

    to_add = []
    total_runs = 0
    for task_id in ids:
        # Poisson-ish distribution: many tasks get few runs, some get many
        k = max(0, int(random.expovariate(1 / RUNS_PER_TASK_AVG)))
        # cap for safety
        k = min(k, 20)

        base_time = utcnow() - timedelta(minutes=120)
        for _ in range(k):
            is_success = random.random() > 0.35  # ~65% success
            code = 200 if is_success else random.choice([0, 408, 429, 500, 502, 503, 504])
            err = None if is_success else random.choice([
                "timeout", "Service Temporarily Unavailable", "connect error", "dns failure", ""
            ])
            latency = random.randint(180, 4800) if is_success else random.randint(400, 1500)

            base_time += timedelta(seconds=random.randint(10, 90))
            to_add.append(Run(
                task_id=task_id,
                status="success" if is_success else "failure",
                latency_ms=latency,
                response_code=code,
                error=err,
                created_at=base_time
            ))

            # batch insert
            if len(to_add) >= BATCH * 5:
                session.add_all(to_add)
                session.commit()
                total_runs += len(to_add)
                to_add = []

    if to_add:
        session.add_all(to_add)
        session.commit()
        total_runs += len(to_add)

    return total_runs

def main():
    print("🔧 Creating tables (if missing)…")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # If tasks already exist, skip task creation
        existing = db.query(Task).count()
        if existing < TOTAL_TASKS:
            print(f"🌱 Seeding tasks up to {TOTAL_TASKS} (existing: {existing})…")
            create_tasks(db, start_index=existing + 1, end_index=TOTAL_TASKS)
        else:
            print(f"✅ Found {existing} tasks, skipping task creation.")

        print("🌱 Seeding runs (this may take a moment)…")
        total_runs = create_runs(db)
        print(f"✅ Done. Inserted ~{total_runs} runs.")
    finally:
        db.close()

if __name__ == "__main__":
    started = time.time()
    main()
    print(f"⏱️ Seed completed in ~{int(time.time()-started)}s")
