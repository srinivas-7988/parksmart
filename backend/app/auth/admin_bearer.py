from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")


class AdminBearer(HTTPBearer):

    async def __call__(self, request: Request):

        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        print("TOKEN:", credentials.credentials)

        try:
            payload = jwt.decode(
                credentials.credentials,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            print("JWT PAYLOAD:", payload)

            if payload.get("role") != "admin":
                raise HTTPException(
                    status_code=403,
                    detail="Admin access required."
                )

            return payload

        except JWTError as e:
            print("JWT ERROR:", e)
            raise HTTPException(
                status_code=403,
                detail="Invalid or expired token."
            )