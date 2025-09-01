# api/auth.py
from fastapi import Depends

def get_current_user():
    return {"user_id": "dev_user"}
