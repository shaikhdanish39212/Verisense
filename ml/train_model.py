import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ==========================================
# 1. Load cleaned dataset
# ==========================================

DATASET_PATH = "dataset/cleaned_WELFake.csv"

df = pd.read_csv(DATASET_PATH)

print("\n========== DATASET LOADED ==========")
print("Rows:", len(df))
print("Columns:", df.columns.tolist())


# ==========================================
# 2. Separate features and labels
# ==========================================

X = df["clean_text"]
y = df["label"]


# ==========================================
# 3. Train / Test Split
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n========== DATA SPLIT ==========")
print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 4. TF-IDF Vectorization
# ==========================================

print("\n========== TF-IDF ==========")

vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    min_df=2,
    sublinear_tf=True
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print("Training TF-IDF shape:", X_train_tfidf.shape)
print("Testing TF-IDF shape:", X_test_tfidf.shape)


# ==========================================
# 5. Train Logistic Regression
# ==========================================

print("\n========== TRAINING MODEL ==========")

model = LogisticRegression(
    max_iter=1000,
    random_state=42
)

model.fit(X_train_tfidf, y_train)

print("Model training completed!")


# ==========================================
# 6. Make Predictions
# ==========================================

y_pred = model.predict(X_test_tfidf)


# ==========================================
# 7. Evaluate Model
# ==========================================

accuracy = accuracy_score(y_test, y_pred)

print("\n========== MODEL RESULTS ==========")

print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Fake", "Real"]
    )
)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# ==========================================
# 8. Save Model and Vectorizer
# ==========================================

MODEL_PATH = "model.joblib"
VECTORIZER_PATH = "tfidf_vectorizer.joblib"

joblib.dump(model, MODEL_PATH)
joblib.dump(vectorizer, VECTORIZER_PATH)

print("\n========== FILES SAVED ==========")
print("Model:", MODEL_PATH)
print("Vectorizer:", VECTORIZER_PATH)

print("\nTraining completed successfully!")