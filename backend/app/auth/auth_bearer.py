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

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if credentials is None:
            raise HTTPException(
                status_code=403,
                detail="No token provided"
            )

        print("===================================")
        print("TOKEN RECEIVED:")
        print(credentials.credentials)
        print("===================================")

        try:
            payload = jwt.decode(
                credentials.credentials,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            print("TOKEN VERIFIED")
            print(payload)

            return payload

        except Exception as e:
            traceback.print_exc()
            print("JWT ERROR:", e)

            raise HTTPException(
                status_code=403,
                detail=str(e)
            )