import re
import joblib


# ==========================================
# Load trained hybrid model
# ==========================================

MODEL_PATH = "../backend/model/svm_model.joblib"
VECTORIZER_PATH = "../backend/model/tfidf_vectorizer.joblib"

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)


# ==========================================
# Text cleaning
# ==========================================

def clean_text(text):

    text = str(text)

    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(
        r"http\S+|www\S+|https\S+",
        "",
        text
    )

    # Remove HTML
    text = re.sub(
        r"<.*?>",
        "",
        text
    )

    # Keep letters and spaces
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
# Prediction function
# ==========================================

def predict_text(text):

    cleaned_text = clean_text(text)

    # Convert to TF-IDF
    text_tfidf = vectorizer.transform(
        [cleaned_text]
    )

    # Prediction
    prediction = model.predict(
        text_tfidf
    )[0]

    # Probability
    probabilities = model.predict_proba(
        text_tfidf
    )[0]

    confidence = max(probabilities) * 100

    # Label
    if prediction == 0:
        label = "FAKE / POTENTIAL MISINFORMATION"
    else:
        label = "REAL / LIKELY AUTHENTIC"

    return prediction, label, confidence


# ==========================================
# Test examples
# ==========================================

examples = [

    "Scientists have discovered a new treatment that completely cures every type of cancer.",

    "The Indian government announced a new education policy for schools.",

    "Drinking warm water can prevent all viral infections.",

    "Scientists have discovered a miracle pill that makes humans live forever, and doctors are hiding the discovery from the public."
]


# ==========================================
# Run predictions
# ==========================================

print("\n========== HYBRID MODEL PREDICTIONS ==========\n")


for text in examples:

    prediction, label, confidence = predict_text(text)

    print("Text:")
    print(text)

    print("\nPrediction:")
    print(label)

    print("Prediction value:", prediction)

    print(f"Confidence: {confidence:.2f}%")

    print("\n" + "-" * 60)