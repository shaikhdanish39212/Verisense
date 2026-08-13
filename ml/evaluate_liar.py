import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


# ==========================================
# FILE PATHS
# ==========================================

DATA_PATH = "dataset/cleaned_liar_test.csv"

MODEL_PATH = "../backend/model/liar_svm_model.joblib"

VECTORIZER_PATH = "../backend/model/liar_tfidf_vectorizer.joblib"


# ==========================================
# LOAD DATASET
# ==========================================

print("\n========== LIAR MODEL EVALUATION ==========\n")

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully!")
print("Total rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())


# ==========================================
# CHECK REQUIRED COLUMNS
# ==========================================

if "clean_text" not in df.columns:
    print("\nERROR: clean_text column not found.")
    exit()

if "label" not in df.columns:
    print("\nERROR: label column not found.")
    exit()


# ==========================================
# REMOVE EMPTY VALUES
# ==========================================

df = df.dropna(
    subset=["clean_text", "label"]
).copy()


# ==========================================
# PREPARE DATA
# ==========================================

X_test = df["clean_text"].astype(str)

y_test = df["label"].astype(int)


print("\nTesting rows:", len(X_test))


# ==========================================
# SHOW LABEL DISTRIBUTION
# ==========================================

print("\nLabel distribution:")

print(y_test.value_counts())


# ==========================================
# LOAD MODEL
# ==========================================

print("\nLoading LIAR SVM model...")

model = joblib.load(MODEL_PATH)

vectorizer = joblib.load(VECTORIZER_PATH)

print("LIAR model loaded successfully!")


# ==========================================
# TF-IDF TRANSFORMATION
# ==========================================

print("\nConverting test data to TF-IDF...")

X_test_tfidf = vectorizer.transform(X_test)

print(
    "TF-IDF test shape:",
    X_test_tfidf.shape
)


# ==========================================
# PREDICTION
# ==========================================

print("\nGenerating predictions...")

y_pred = model.predict(X_test_tfidf)


# ==========================================
# CALCULATE METRICS
# ==========================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)


# ==========================================
# DISPLAY RESULTS
# ==========================================

print("\n")
print("==========================================")
print("          LIAR MODEL RESULTS")
print("==========================================")

print(
    f"\nAccuracy  : {accuracy * 100:.2f}%"
)

print(
    f"Precision : {precision * 100:.2f}%"
)

print(
    f"Recall    : {recall * 100:.2f}%"
)

print(
    f"F1 Score  : {f1 * 100:.2f}%"
)


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print("\n")
print("==========================================")
print("        CLASSIFICATION REPORT")
print("==========================================\n")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "Fake",
            "Real"
        ],
        zero_division=0
    )
)


# ==========================================
# CONFUSION MATRIX
# ==========================================

print("\n")
print("==========================================")
print("          CONFUSION MATRIX")
print("==========================================\n")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)


# ==========================================
# CONFUSION MATRIX MEANING
# ==========================================

print("\n")
print("Confusion Matrix:")
print("------------------------------------------")

print("             Predicted")

print("             Fake    Real")

print(
    f"Actual Fake  {cm[0][0]:<7} {cm[0][1]}"
)

print(
    f"Actual Real  {cm[1][0]:<7} {cm[1][1]}"
)


# ==========================================
# COMPLETED
# ==========================================

print("\n")
print("==========================================")
print(" LIAR EVALUATION COMPLETED SUCCESSFULLY")
print("==========================================")