from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# ---------- Task ----------
class TaskCreate(BaseModel):
    url: str
    method: str = Field(pattern="^(GET|POST|PUT|DELETE|PATCH)$")
    headers: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    schedule_cron: Optional[str] = None
    enabled: bool = True

class TaskUpdate(BaseModel):
    url: Optional[str] = None
    method: Optional[str] = Field(default=None, pattern="^(GET|POST|PUT|DELETE|PATCH)$")
    headers: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    schedule_cron: Optional[str] = None
    enabled: Optional[bool] = None

class TaskOut(BaseModel):
    id: int
    user_id: Optional[str] = None
    url: str
    method: str
    schedule_cron: Optional[str] = None
    enabled: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ---------- Run ----------
class RunOut(BaseModel):
    id: int
    task_id: int
    status: str
    latency_ms: int
    response_code: Optional[int] = None
    error: Optional[str] = None
    created_at: datetime
    failure_class: Optional[str] = None
    failure_explanation: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ---------- DLQ ----------
class DLQOut(BaseModel):
    id: int
    task_id: int
    error: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
