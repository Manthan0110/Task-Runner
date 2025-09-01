# utils.py
import json, os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("FERNET_KEY")
if not KEY:
    KEY = Fernet.generate_key().decode()
    print(f"⚠️ Generated new FERNET_KEY: {KEY} (save this in .env for reuse)")

fernet = Fernet(KEY.encode())

def encrypt_headers(headers: dict) -> str:
    return fernet.encrypt(json.dumps(headers).encode()).decode()

def decrypt_headers(token: str) -> dict:
    return json.loads(fernet.decrypt(token.encode()).decode())
