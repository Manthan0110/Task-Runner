# models.py
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
import datetime

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    url = Column(String, nullable=False)
    method = Column(String, default="GET")
    headers_encrypted = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    schedule_cron = Column(String, nullable=True)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Run(Base):
    __tablename__ = "runs"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    status = Column(String)
    latency_ms = Column(Integer, default=0)
    response_code = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DeadLetterQueue(Base):
    __tablename__ = "dlq"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
