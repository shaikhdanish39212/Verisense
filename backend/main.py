from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

import logging
import re
import secrets
import hashlib
import smtplib
import ssl
import joblib
import os
import time
import psycopg2

from email.message import EmailMessage
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="VeriSense API",
    description="NLP-based misinformation detection API",
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://verisense.vercel.app",
]

extra_origins = os.getenv("ALLOWED_ORIGINS", "")

if extra_origins:
    ALLOWED_ORIGINS.extend(
        origin.strip()
        for origin in extra_origins.split(",")
        if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=(
        r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|"
        r"10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)"
        r"(:\d+)?"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("verisense")

DATABASE_URL = os.getenv("DATABASE_URL")

JWT_SECRET = os.getenv("JWT_SECRET")

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ============================================================
# SECURITY CONFIGURATION
# ============================================================

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not configured in backend/.env"
    )


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

security = HTTPBearer()

RATE_LIMIT_WINDOW_SECONDS = int(
    os.getenv(
        "RATE_LIMIT_WINDOW_SECONDS",
        "60"
    )
)

RATE_LIMIT_MAX_REQUESTS = int(
    os.getenv(
        "RATE_LIMIT_MAX_REQUESTS",
        "30"
    )
)

REQUEST_TIMESTAMPS = {}


def get_client_ip(request: Request):

    forwarded_for = request.headers.get(
        "x-forwarded-for"
    )

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def enforce_rate_limit(request: Request):

    client_ip = get_client_ip(request)
    now = time.time()

    timestamps = REQUEST_TIMESTAMPS.setdefault(
        client_ip,
        []
    )

    timestamps[:] = [
        timestamp
        for timestamp in timestamps
        if now - timestamp < RATE_LIMIT_WINDOW_SECONDS
    ]

    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many requests. "
                "Please wait a moment and try again."
            )
        )

    timestamps.append(now)


# ============================================================
# MODEL PATHS
# ============================================================

WELFAKE_MODEL_PATH = (
    MODEL_DIR / "svm_model.joblib"
)

WELFAKE_VECTORIZER_PATH = (
    MODEL_DIR / "tfidf_vectorizer.joblib"
)

LIAR_MODEL_PATH = (
    MODEL_DIR / "liar_svm_model.joblib"
)

LIAR_VECTORIZER_PATH = (
    MODEL_DIR / "liar_tfidf_vectorizer.joblib"
)


# ============================================================
# CHECK MODEL FILES
# ============================================================

required_files = [
    WELFAKE_MODEL_PATH,
    WELFAKE_VECTORIZER_PATH,
    LIAR_MODEL_PATH,
    LIAR_VECTORIZER_PATH,
]

for file_path in required_files:

    if not file_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {file_path}"
        )


# ============================================================
# LOAD WELFAKE MODEL
# ============================================================

print("Loading WELFake model...")

model = joblib.load(
    WELFAKE_MODEL_PATH
)

vectorizer = joblib.load(
    WELFAKE_VECTORIZER_PATH
)

print(
    "WELFake model loaded successfully!"
)


# ============================================================
# LOAD LIAR MODEL
# ============================================================

print("Loading LIAR model...")

liar_model = joblib.load(
    LIAR_MODEL_PATH
)

liar_vectorizer = joblib.load(
    LIAR_VECTORIZER_PATH
)

print(
    "LIAR model loaded successfully!"
)


# ============================================================
# REQUEST MODELS
# ============================================================

class PredictionRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description=(
            "Text to classify. "
            "Maximum 2,000 characters."
        )
    )


class RegisterRequest(BaseModel):

    email: str = Field(
        ...,
        min_length=5,
        max_length=255
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )


class LoginRequest(BaseModel):

    email: str = Field(
        ...,
        min_length=5,
        max_length=255
    )

    password: str = Field(
        ...,
        min_length=1,
        max_length=128
    )


class ForgotPasswordRequest(BaseModel):

    email: str = Field(
        ...,
        min_length=5,
        max_length=255
    )


class ResetPasswordRequest(BaseModel):

    token: str = Field(
        ...,
        min_length=1,
        max_length=500
    )

    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )


# ============================================================
# DATABASE CONNECTION & TABLE INITIALIZATION
# ============================================================

_tables_initialized = False


def init_db_tables(connection):

    global _tables_initialized

    if _tables_initialized:
        return

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE
                        DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS prediction_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER
                        REFERENCES users(id)
                        ON DELETE CASCADE,
                    text TEXT NOT NULL,
                    prediction INTEGER NOT NULL,
                    confidence DOUBLE PRECISION NOT NULL,
                    model VARCHAR(100) NOT NULL,
                    dataset VARCHAR(100) NOT NULL,
                    model_accuracy VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE
                        DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL
                        REFERENCES users(id)
                        ON DELETE CASCADE,
                    token_hash VARCHAR(255) NOT NULL UNIQUE,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE
                        DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS
                idx_reset_token_hash
                ON password_reset_tokens(token_hash);

                CREATE INDEX IF NOT EXISTS
                idx_reset_user_id
                ON password_reset_tokens(user_id);
                """
            )

        connection.commit()

        _tables_initialized = True

    except Exception as error:

        logger.warning(
            "Could not auto-initialize DB tables: %s",
            error
        )


def get_db_connection():

    if not DATABASE_URL:

        raise RuntimeError(
            "DATABASE_URL is not configured."
        )

    return psycopg2.connect(
        DATABASE_URL
    )


def require_db_connection():

    try:

        conn = get_db_connection()

        init_db_tables(conn)

        return conn

    except RuntimeError as error:

        logger.error(
            "Database configuration error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Database configuration is unavailable."
        )

    except Exception as error:

        logger.error(
            "Database connection error: %s",
            error
        )

        raise HTTPException(
            status_code=503,
            detail="Database service is currently unavailable."
        )


# ============================================================
# EMAIL VALIDATION
# ============================================================

def validate_email(email):

    email = email.strip().lower()

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    if not re.match(pattern, email):

        raise HTTPException(
            status_code=400,
            detail="Please provide a valid email address."
        )

    return email


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password):

    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ============================================================
# JWT TOKEN
# ============================================================

def create_access_token(user_id):

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        return int(user_id)

    except (JWTError, ValueError):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):

    text = str(text)

    text = text.lower()

    text = re.sub(
        r"http\S+|www\S+|https\S+",
        "",
        text
    )

    text = re.sub(
        r"<.*?>",
        "",
        text
    )

    text = re.sub(
        r"[^a-zA-Z\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Misinformation Detection API is running",
        "status": "success",
        "version": "2.0.0",
        "models": [
            "WELFake Hybrid SVM",
            "LIAR SVM"
        ]
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    connection = None

    database_status = "disconnected"

    try:

        connection = get_db_connection()

        with connection.cursor() as cursor:

            cursor.execute("SELECT 1")

        database_status = "connected"

    except Exception as error:

        logger.error(
            "Health check error: %s",
            error
        )

    finally:

        if connection is not None:
            connection.close()

    return {
        "status": "healthy",
        "welfake_model": "loaded",
        "liar_model": "loaded",
        "database": database_status
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    request: Request,
    payload: RegisterRequest
):

    enforce_rate_limit(request)

    email = validate_email(
        payload.email
    )

    password = payload.password

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )

    connection = None

    try:

        connection = require_db_connection()

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE email = %s
                    """,
                    (email,)
                )

                existing_user = cursor.fetchone()

                if existing_user:

                    raise HTTPException(
                        status_code=409,
                        detail=(
                            "An account with this email "
                            "already exists."
                        )
                    )

                password_hash = hash_password(
                    password
                )

                cursor.execute(
                    """
                    INSERT INTO users
                    (
                        email,
                        password_hash
                    )
                    VALUES
                    (%s, %s)
                    RETURNING id, email
                    """,
                    (
                        email,
                        password_hash
                    )
                )

                user = cursor.fetchone()

        return {
            "status": "success",
            "message": "Account created successfully.",
            "user": {
                "id": user[0],
                "email": user[1]
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Registration error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    request: Request,
    payload: LoginRequest
):

    enforce_rate_limit(request)

    email = validate_email(
        payload.email
    )

    connection = None

    try:

        connection = require_db_connection()

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    email,
                    password_hash
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        user_id = user[0]
        password_hash = user[2]

        if not verify_password(
            payload.password,
            password_hash
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        token = create_access_token(
            user_id
        )

        return {
            "status": "success",
            "message": "Login successful.",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user[0],
                "email": user[1]
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Login error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to login."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# SMTP CONFIGURATION
# ============================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    ""
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587"
    )
)

SMTP_USER = os.getenv(
    "SMTP_USER",
    ""
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    ""
)

SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL",
    SMTP_USER or "noreply@verisense.app"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
).rstrip("/")


# ============================================================
# SEND RESET PASSWORD EMAIL
# ============================================================

def send_reset_password_email(
    email: str,
    reset_link: str
) -> bool:

    if (
        not SMTP_HOST
        or not SMTP_USER
        or not SMTP_PASSWORD
    ):

        logger.warning(
            "SMTP credentials are not fully configured."
        )

        logger.warning(
            "Development reset link for %s: %s",
            email,
            reset_link
        )

        return False

    try:

        message = EmailMessage()

        message["Subject"] = (
            "VeriSense - Reset Your Password"
        )

        message["From"] = SMTP_FROM_EMAIL
        message["To"] = email

        message.set_content(
            f"""
Hello,

You requested a password reset for your VeriSense account.

Click the link below to create a new password:

{reset_link}

This password reset link is valid for 15 minutes
and can only be used once.

If you did not request a password reset,
please ignore this email.

Best regards,
The VeriSense Team
"""
        )

        context = ssl.create_default_context()

        if SMTP_PORT == 465:

            with smtplib.SMTP_SSL(
                SMTP_HOST,
                SMTP_PORT,
                timeout=10,
                context=context
            ) as server:

                server.login(
                    SMTP_USER,
                    SMTP_PASSWORD
                )

                server.send_message(
                    message
                )

        else:

            with smtplib.SMTP(
                SMTP_HOST,
                SMTP_PORT,
                timeout=10
            ) as server:

                server.ehlo()

                server.starttls(
                    context=context
                )

                server.ehlo()

                server.login(
                    SMTP_USER,
                    SMTP_PASSWORD
                )

                server.send_message(
                    message
                )

        logger.info(
            "Password reset email sent to %s",
            email
        )

        return True

    except Exception as error:

        logger.error(
            "Failed to send reset email to %s: %s",
            email,
            error
        )

        return False


# ============================================================
# FORGOT PASSWORD
# ============================================================

@app.post("/forgot-password")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest
):

    enforce_rate_limit(request)

    email = validate_email(
        payload.email
    )

    connection = None

    try:

        connection = require_db_connection()

        raw_token = None
        dev_reset_link = None

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE email = %s
                    """,
                    (email,)
                )

                user = cursor.fetchone()

                if not user:

                    return {
                        "status": "success",
                        "message": (
                            "If an account with that email exists, "
                            "password reset instructions have been sent."
                        )
                    }

                user_id = user[0]

                cursor.execute(
                    """
                    UPDATE password_reset_tokens
                    SET used = TRUE
                    WHERE user_id = %s
                    AND used = FALSE
                    """,
                    (user_id,)
                )

                raw_token = secrets.token_urlsafe(32)

                token_hash = hashlib.sha256(
                    raw_token.encode("utf-8")
                ).hexdigest()

                expires_at = (
                    datetime.now(timezone.utc)
                    + timedelta(minutes=15)
                )

                cursor.execute(
                    """
                    INSERT INTO password_reset_tokens
                    (
                        user_id,
                        token_hash,
                        expires_at,
                        used
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        FALSE
                    )
                    """,
                    (
                        user_id,
                        token_hash,
                        expires_at
                    )
                )

                reset_link = (
                    f"{FRONTEND_URL}"
                    f"/?reset_token={raw_token}"
                )

                email_sent = send_reset_password_email(
                    email,
                    reset_link
                )

                if not email_sent:
                    dev_reset_link = reset_link

        response_data = {
            "status": "success",
            "message": (
                "If an account with that email exists, "
                "password reset instructions have been sent."
            )
        }

        if dev_reset_link:

            response_data["dev_reset_link"] = (
                dev_reset_link
            )

            response_data["dev_reset_token"] = (
                raw_token
            )

        return response_data

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Forgot password error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to process password reset request."
            )
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# VERIFY RESET TOKEN
# ============================================================

@app.get("/verify-reset-token")
def verify_reset_token(
    token: str
):

    token_str = (
        token.strip()
        if token
        else ""
    )

    if not token_str:

        raise HTTPException(
            status_code=400,
            detail="Reset token is required."
        )

    token_hash = hashlib.sha256(
        token_str.encode("utf-8")
    ).hexdigest()

    connection = None

    try:

        connection = require_db_connection()

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    expires_at,
                    used
                FROM password_reset_tokens
                WHERE token_hash = %s
                """,
                (token_hash,)
            )

            record = cursor.fetchone()

        if not record:

            return {
                "valid": False,
                "reason": "Invalid token."
            }

        token_id = record[0]
        expires_at = record[1]
        used = record[2]

        if used:

            return {
                "valid": False,
                "reason": "Token has already been used."
            }

        now = datetime.now(
            timezone.utc
        )

        if expires_at < now:

            return {
                "valid": False,
                "reason": "Token has expired."
            }

        return {
            "valid": True,
            "token_id": token_id,
            "message": "Token is valid."
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Verify reset token error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to verify token."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# RESET PASSWORD
# ============================================================

@app.post("/reset-password")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest
):

    enforce_rate_limit(request)

    token = payload.token.strip()
    new_password = payload.new_password

    if not token:

        raise HTTPException(
            status_code=400,
            detail="Reset token is required."
        )

    if len(new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least 8 characters."
            )
        )

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    connection = None

    try:

        connection = require_db_connection()

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        user_id,
                        expires_at,
                        used
                    FROM password_reset_tokens
                    WHERE token_hash = %s
                    FOR UPDATE
                    """,
                    (token_hash,)
                )

                record = cursor.fetchone()

                if not record:

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Invalid or expired reset token."
                        )
                    )

                token_id = record[0]
                user_id = record[1]
                expires_at = record[2]
                used = record[3]

                if used:

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "This reset token has already "
                            "been used."
                        )
                    )

                now = datetime.now(
                    timezone.utc
                )

                if expires_at < now:

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "This reset token has expired. "
                            "Please request a new one."
                        )
                    )

                new_password_hash = hash_password(
                    new_password
                )

                cursor.execute(
                    """
                    UPDATE users
                    SET password_hash = %s
                    WHERE id = %s
                    """,
                    (
                        new_password_hash,
                        user_id
                    )
                )

                cursor.execute(
                    """
                    UPDATE password_reset_tokens
                    SET used = TRUE
                    WHERE id = %s
                    """,
                    (token_id,)
                )

        return {
            "status": "success",
            "message": (
                "Password reset successfully. "
                "You can now login with your new password."
            )
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Reset password error: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to reset password."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# GET CURRENT USER
# ============================================================

@app.get("/me")
def get_me(
    user_id: int = Depends(
        get_current_user
    )
):

    connection = None

    try:

        connection = require_db_connection()

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    email,
                    created_at
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )

            user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        return {
            "status": "success",
            "user": {
                "id": user[0],
                "email": user[1],
                "created_at": user[2].isoformat()
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Could not fetch user: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch user information."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# SAVE PREDICTION
# ============================================================

def save_prediction_history(
    user_id,
    text,
    prediction,
    confidence,
    model_name,
    dataset_name,
    model_accuracy
):

    connection = None

    try:

        connection = get_db_connection()

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO prediction_history
                    (
                        user_id,
                        text,
                        prediction,
                        confidence,
                        model,
                        dataset,
                        model_accuracy
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        user_id,
                        text,
                        int(prediction),
                        float(confidence),
                        model_name,
                        dataset_name,
                        model_accuracy
                    )
                )

    except Exception as error:

        logger.error(
            "Could not save prediction history: %s",
            error
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# FORMAT HISTORY ROW
# ============================================================

def format_history_row(row):

    return {
        "id": row[0],
        "text": row[1],
        "prediction": row[2],
        "confidence": float(row[3]),
        "model": row[4],
        "dataset": row[5],
        "model_accuracy": row[6],
        "created_at": row[7].isoformat()
    }


# ============================================================
# GET USER HISTORY
# ============================================================

@app.get("/history")
def get_prediction_history(
    user_id: int = Depends(
        get_current_user
    )
):

    connection = None

    try:

        connection = require_db_connection()

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    text,
                    prediction,
                    confidence,
                    model,
                    dataset,
                    model_accuracy,
                    created_at
                FROM prediction_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
                """,
                (user_id,)
            )

            rows = cursor.fetchall()

        return {
            "status": "success",
            "count": len(rows),
            "history": [
                format_history_row(row)
                for row in rows
            ]
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Could not fetch history: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch prediction history."
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# DELETE SINGLE USER HISTORY ITEM
# ============================================================

@app.delete("/history/{history_id}")
def delete_prediction_history_item(
    history_id: int,
    user_id: int = Depends(
        get_current_user
    )
):

    connection = None

    try:

        connection = require_db_connection()

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM prediction_history
                    WHERE id = %s
                    AND user_id = %s
                    RETURNING id
                    """,
                    (
                        history_id,
                        user_id
                    )
                )

                deleted_row = cursor.fetchone()

        if deleted_row is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Prediction history item not found."
                )
            )

        return {
            "status": "success",
            "message": (
                "Prediction history item deleted."
            ),
            "deleted_id": history_id
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Could not delete history item: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to delete prediction "
                "history item."
            )
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# DELETE ALL USER HISTORY
# ============================================================

@app.delete("/history")
def clear_prediction_history(
    user_id: int = Depends(
        get_current_user
    )
):

    connection = None

    try:

        connection = require_db_connection()

        with connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM prediction_history
                    WHERE user_id = %s
                    """,
                    (user_id,)
                )

                deleted_count = cursor.rowcount

        return {
            "status": "success",
            "message": "Prediction history cleared.",
            "deleted_count": deleted_count
        }

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "Could not clear history: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to clear prediction history."
            )
        )

    finally:

        if connection is not None:
            connection.close()


# ============================================================
# WELFAKE PREDICTION
# ============================================================

@app.post("/predict")
def predict(
    request: Request,
    payload: PredictionRequest,
    user_id: int = Depends(
        get_current_user
    )
):

    enforce_rate_limit(request)

    original_text = payload.text.strip()

    if not original_text:

        return {
            "prediction": -1,
            "label": "No text provided",
            "confidence": 0.0
        }

    cleaned_text = clean_text(
        original_text
    )

    if not cleaned_text:

        return {
            "prediction": -1,
            "label": "No valid text provided",
            "confidence": 0.0
        }

    text_tfidf = vectorizer.transform(
        [cleaned_text]
    )

    prediction = model.predict(
        text_tfidf
    )[0]

    probabilities = model.predict_proba(
        text_tfidf
    )[0]

    confidence = max(
        probabilities
    )

    if int(prediction) == 0:

        label = (
            "Fake / Potential Misinformation"
        )

    else:

        label = (
            "Real / Likely Authentic"
        )

    save_prediction_history(
        user_id=user_id,
        text=original_text,
        prediction=int(prediction),
        confidence=float(confidence),
        model_name="Hybrid SVM",
        dataset_name="WELFake Dataset",
        model_accuracy="98.65%"
    )

    return {
        "prediction": int(prediction),
        "label": label,
        "confidence": float(confidence)
    }


# ============================================================
# LIAR PREDICTION
# ============================================================

@app.post("/predict-liar")
def predict_liar(
    request: Request,
    payload: PredictionRequest,
    user_id: int = Depends(
        get_current_user
    )
):

    enforce_rate_limit(request)

    original_text = payload.text.strip()

    if not original_text:

        return {
            "prediction": -1,
            "label": "No text provided",
            "confidence": 0.0
        }

    cleaned_text = clean_text(
        original_text
    )

    if not cleaned_text:

        return {
            "prediction": -1,
            "label": "No valid text provided",
            "confidence": 0.0
        }

    text_tfidf = liar_vectorizer.transform(
        [cleaned_text]
    )

    prediction = liar_model.predict(
        text_tfidf
    )[0]

    probabilities = liar_model.predict_proba(
        text_tfidf
    )[0]

    confidence = max(
        probabilities
    )

    if int(prediction) == 0:

        label = (
            "Fake / Potential Misinformation"
        )

    else:

        label = (
            "Real / Likely Authentic"
        )

    save_prediction_history(
        user_id=user_id,
        text=original_text,
        prediction=int(prediction),
        confidence=float(confidence),
        model_name="LIAR SVM",
        dataset_name="LIAR Dataset",
        model_accuracy="61.17%"
    )

    return {
        "prediction": int(prediction),
        "label": label,
        "confidence": float(confidence)
    }