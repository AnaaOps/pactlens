"""FastAPI router for user authentication (Register, Login, Me, Logout)."""

from __future__ import annotations

import os
import re
from typing import Optional
from fastapi import APIRouter, Cookie, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator

from app.auth.mongo import (
    create_user_record,
    find_user_by_email,
    find_user_by_id,
    find_user_by_identifier,
    find_user_by_phone,
    serialize_user,
)
from app.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

COOKIE_NAME = "access_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: str = Field(..., description="Valid email address")
    phone_number: str = Field(..., min_length=7, max_length=20, description="Phone number with country or std code")
    password: str = Field(..., min_length=6, max_length=128, description="Plaintext password")

    @field_validator("email")
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Please provide a valid email address.")
        return clean

    @field_validator("phone_number")
    def validate_phone(cls, v: str) -> str:
        clean = re.sub(r"[\s\-\(\)]", "", v.strip())
        if not re.match(r"^\+?[0-9]{7,15}$", clean):
            raise ValueError("Please provide a valid phone number with 7 to 15 digits.")
        return clean


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=2, description="Email address or phone number")
    password: str = Field(..., min_length=1, description="Password")


def _get_token_from_request(
    request: Request,
    authorization: Optional[str] = None,
    cookie_token: Optional[str] = None,
) -> Optional[str]:
    # 1. Try HTTP-only cookie
    if cookie_token:
        return cookie_token
    token_from_cookie = request.cookies.get(COOKIE_NAME)
    if token_from_cookie:
        return token_from_cookie

    # 2. Try Authorization header
    auth_hdr = authorization or request.headers.get("Authorization")
    if auth_hdr and auth_hdr.startswith("Bearer "):
        return auth_hdr[7:].strip()

    return None


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, response: Response):
    # Check duplicate email
    if find_user_by_email(req.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # Check duplicate phone
    if find_user_by_phone(req.phone_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists. Please sign in instead.",
        )

    hashed = hash_password(req.password)
    user_doc = create_user_record(
        name=req.name,
        email=req.email,
        phone_number=req.phone_number,
        password_hash=hashed,
    )

    user_id = str(user_doc["_id"])
    token = create_access_token(user_id=user_id, email=req.email, name=req.name)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )

    return {
        "ok": True,
        "user": serialize_user(user_doc),
        "token": token,
        "message": "Registration successful.",
    }


@auth_router.post("/login")
def login(req: LoginRequest, response: Response):
    user_doc = find_user_by_identifier(req.identifier)
    if not user_doc or not verify_password(req.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/phone and password.",
        )

    user_id = str(user_doc["_id"])
    token = create_access_token(
        user_id=user_id,
        email=user_doc.get("email", ""),
        name=user_doc.get("name", ""),
    )

    # Set secure HTTP-only cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )

    return {
        "ok": True,
        "user": serialize_user(user_doc),
        "token": token,
        "message": "Signed in successfully.",
    }


@auth_router.get("/me")
def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None),
):
    token = _get_token_from_request(request, authorization, access_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token.",
        )

    user_doc = find_user_by_id(payload["sub"])
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    return {
        "ok": True,
        "user": serialize_user(user_doc),
    }


@auth_router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
    return {
        "ok": True,
        "message": "Signed out successfully.",
    }
