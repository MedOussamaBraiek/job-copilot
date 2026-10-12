import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException
from jwt import PyJWKClient

load_dotenv("./.env")

_jwks_client = PyJWKClient(os.getenv("CLERK_JWKS_URL", ""))


def get_current_user_id(authorization: str = Header(default="")) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme != "Bearer" or not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        claims = jwt.decode(token, signing_key.key, algorithms=["RS256"], options={"verify_aud": False}, leeway=30)
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    return claims["sub"]
