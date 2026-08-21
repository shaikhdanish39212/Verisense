from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

import re
import joblib
import os
import psycopg2

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
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
        description="Text to classify. Maximum 2,000 characters."
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


# ============================================================
# DATABASE CONNECTION
# ============================================================

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

        return get_db_connection()

    except RuntimeError as error:

        print(
            f"Database configuration error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Database configuration is unavailable."
        )

    except Exception as error:

        print(
            f"Database connection error: {error}"
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

    return pwd_context.hash(
        password
    )


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

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
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

            cursor.execute(
                "SELECT 1"
            )

        database_status = "connected"

    except Exception as error:

        print(
            f"Health check error: {error}"
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
    request: RegisterRequest
):

    email = validate_email(
        request.email
    )

    password = request.password

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
                        detail="An account with this email already exists."
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

        print(
            f"Registration error: {error}"
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
    request: LoginRequest
):

    email = validate_email(
        request.email
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
            request.password,
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

        print(
            f"Login error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to login."
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

        print(
            f"Could not fetch user: {error}"
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

        print(
            f"Could not save prediction history: {error}"
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

        print(
            f"Could not fetch history: {error}"
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
                detail="Prediction history item not found."
            )

        return {
            "status": "success",
            "message": "Prediction history item deleted.",
            "deleted_id": history_id
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            f"Could not delete history item: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete prediction history item."
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

        print(
            f"Could not clear history: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to clear prediction history."
        )

    finally:

        if connection is not None:

            connection.close()


# ============================================================
# WELFAKE PREDICTION
# ============================================================

@app.post("/predict")
def predict(
    request: PredictionRequest,
    user_id: int = Depends(
        get_current_user
    )
):

    original_text = request.text.strip()

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

        label = "Fake / Potential Misinformation"

    else:

        label = "Real / Likely Authentic"

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
    request: PredictionRequest,
    user_id: int = Depends(
        get_current_user
    )
):

    original_text = request.text.strip()

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

        label = "Fake / Potential Misinformation"

    else:

        label = "Real / Likely Authentic"

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