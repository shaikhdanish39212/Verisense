import joblib


# ==========================================
# Load LIAR model and vectorizer
# ==========================================

MODEL_PATH = "../backend/model/liar_svm_model.joblib"
VECTORIZER_PATH = "../backend/model/liar_tfidf_vectorizer.joblib"

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)


# ==========================================
# Prediction function
# ==========================================

def predict_text(text):

    # Convert text into TF-IDF
    text_tfidf = vectorizer.transform([text])

    # Prediction
    prediction = model.predict(text_tfidf)[0]

    # Probability
    probabilities = model.predict_proba(text_tfidf)[0]

    confidence = max(probabilities) * 100

    if prediction == 0:
        label = "FAKE / POTENTIAL MISINFORMATION"
    else:
        label = "REAL / LIKELY AUTHENTIC"

    return label, confidence


# ==========================================
# Test examples
# ==========================================

examples = [
    "The government announced a new education policy for schools.",
    "Scientists have discovered a miracle treatment that cures every disease.",
    "The president announced a new economic policy today.",
    "Drinking a special mixture can make humans live forever."
]


# ==========================================
# Predictions
# ==========================================

print("\n========== LIAR MODEL PREDICTIONS ==========\n")

for text in examples:

    label, confidence = predict_text(text)

    print("Statement:")
    print(text)

    print("\nPrediction:")
    print(label)

    print(f"Confidence: {confidence:.2f}%")

    print("\n" + "-" * 60)