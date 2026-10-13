from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
import traceback

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=False)

    async def __call__(self, request: Request):
        token = None

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        elif "token" in request.query_params:
            token = request.query_params["token"]

        if not token:
            raise HTTPException(
                status_code=403,
                detail="No token provided"
            )

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )
            return payload

        except Exception as e:
            traceback.print_exc()
            raise HTTPException(
                status_code=403,
                detail=str(e)
            )