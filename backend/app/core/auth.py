import jwt
import datetime
from typing import Optional
from app.core.config import settings

SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"


def create_token(user_id: str, username: str, role: str, allowed_modules: Optional[list] = None) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "allowed_modules": allowed_modules or ["product", "sop", "training"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
