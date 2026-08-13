from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import re
import joblib
from pathlib import Path


# ==========================================
# CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Misinformation Detection API",
    description="NLP-based misinformation detection API",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# MODEL DIRECTORY
# ==========================================

# Get the folder containing main.py
BASE_DIR = Path(__file__).resolve().parent

# Models are inside backend/model/
MODEL_DIR = BASE_DIR / "model"


# ==========================================
# WELFAKE MODEL PATHS
# ==========================================

WELFAKE_MODEL_PATH = MODEL_DIR / "svm_model.joblib"
WELFAKE_VECTORIZER_PATH = MODEL_DIR / "tfidf_vectorizer.joblib"


# ==========================================
# LIAR MODEL PATHS
# ==========================================

LIAR_MODEL_PATH = MODEL_DIR / "liar_svm_model.joblib"
LIAR_VECTORIZER_PATH = MODEL_DIR / "liar_tfidf_vectorizer.joblib"


# ==========================================
# CHECK MODEL FILES
# ==========================================

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


# ==========================================
# LOAD WELFAKE HYBRID SVM
# ==========================================

print("Loading WELFake model...")

model = joblib.load(WELFAKE_MODEL_PATH)
vectorizer = joblib.load(WELFAKE_VECTORIZER_PATH)

print("WELFake model loaded successfully!")


# ==========================================
# LOAD LIAR SVM
# ==========================================

print("Loading LIAR model...")

liar_model = joblib.load(LIAR_MODEL_PATH)
liar_vectorizer = joblib.load(LIAR_VECTORIZER_PATH)

print("LIAR model loaded successfully!")


# ==========================================
# REQUEST MODEL
# ==========================================

class PredictionRequest(BaseModel):
    text: str


# ==========================================
# TEXT CLEANING
# ==========================================

def clean_text(text):
    """
    Clean input text before TF-IDF transformation.
    """

    text = str(text)

    # Convert to lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(
        r"http\S+|www\S+|https\S+",
        "",
        text
    )

    # Remove HTML tags
    text = re.sub(
        r"<.*?>",
        "",
        text
    )

    # Keep only letters and spaces
    text = re.sub(
        r"[^a-zA-Z\s]",
        " ",
        text
    )

    # Remove extra spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Misinformation Detection API is running",
        "status": "success",
        "models": [
            "WELFake Hybrid SVM",
            "LIAR SVM"
        ]
    }


# ==========================================
# HEALTH CHECK ENDPOINT
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "welfake_model": "loaded",
        "liar_model": "loaded"
    }


# ==========================================
# WELFAKE PREDICTION
# ==========================================

@app.post("/predict")
def predict(request: PredictionRequest):

    # --------------------------------------
    # Validate input
    # --------------------------------------

    if not request.text.strip():

        return {
            "prediction": -1,
            "label": "No text provided",
            "confidence": 0.0
        }

    # --------------------------------------
    # Clean text
    # --------------------------------------

    cleaned_text = clean_text(request.text)

    # Check after cleaning
    if not cleaned_text:

        return {
            "prediction": -1,
            "label": "No valid text provided",
            "confidence": 0.0
        }

    # --------------------------------------
    # Convert text to TF-IDF
    # --------------------------------------

    text_tfidf = vectorizer.transform(
        [cleaned_text]
    )

    # --------------------------------------
    # Generate prediction
    # --------------------------------------

    prediction = model.predict(
        text_tfidf
    )[0]

    # --------------------------------------
    # Generate probabilities
    # --------------------------------------

    probabilities = model.predict_proba(
        text_tfidf
    )[0]

    # Highest probability
    confidence = max(probabilities)

    # --------------------------------------
    # Convert prediction to label
    # --------------------------------------

    if int(prediction) == 0:

        label = "Fake / Potential Misinformation"

    else:

        label = "Real / Likely Authentic"

    # --------------------------------------
    # Return result
    # --------------------------------------

    return {
        "prediction": int(prediction),
        "label": label,
        "confidence": float(confidence)
    }


# ==========================================
# LIAR PREDICTION
# ==========================================

@app.post("/predict-liar")
def predict_liar(request: PredictionRequest):

    # --------------------------------------
    # Validate input
    # --------------------------------------

    if not request.text.strip():

        return {
            "prediction": -1,
            "label": "No text provided",
            "confidence": 0.0
        }

    # --------------------------------------
    # Clean text
    # --------------------------------------

    cleaned_text = clean_text(request.text)

    # Check after cleaning
    if not cleaned_text:

        return {
            "prediction": -1,
            "label": "No valid text provided",
            "confidence": 0.0
        }

    # --------------------------------------
    # Convert text to TF-IDF
    # --------------------------------------

    text_tfidf = liar_vectorizer.transform(
        [cleaned_text]
    )

    # --------------------------------------
    # Generate prediction
    # --------------------------------------

    prediction = liar_model.predict(
        text_tfidf
    )[0]

    # --------------------------------------
    # Generate probabilities
    # --------------------------------------

    probabilities = liar_model.predict_proba(
        text_tfidf
    )[0]

    # Highest probability
    confidence = max(probabilities)

    # --------------------------------------
    # Convert prediction to label
    # --------------------------------------

    if int(prediction) == 0:

        label = "Fake / Potential Misinformation"

    else:

        label = "Real / Likely Authentic"

    # --------------------------------------
    # Return result
    # --------------------------------------

    return {
        "prediction": int(prediction),
        "label": label,
        "confidence": float(confidence)
    }