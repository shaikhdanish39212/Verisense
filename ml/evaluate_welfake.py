import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
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

DATA_PATH = "dataset/cleaned_WELFake.csv"

MODEL_PATH = "../backend/model/svm_model.joblib"

VECTORIZER_PATH = "../backend/model/tfidf_vectorizer.joblib"


# ==========================================
# LOAD DATASET
# ==========================================

print("\n========== WELFAKE MODEL EVALUATION ==========\n")

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully!")
print("Total rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())


# ==========================================
# FIND TEXT COLUMN
# ==========================================

possible_text_columns = [
    "text",
    "clean_text",
    "title",
    "content"
]

text_column = None

for column in possible_text_columns:
    if column in df.columns:
        text_column = column
        break


if text_column is None:
    print("\nERROR: Text column not found.")
    print("Available columns:", df.columns.tolist())
    exit()


# ==========================================
# FIND LABEL COLUMN
# ==========================================

possible_label_columns = [
    "label",
    "Label",
    "class",
    "target"
]

label_column = None

for column in possible_label_columns:
    if column in df.columns:
        label_column = column
        break


if label_column is None:
    print("\nERROR: Label column not found.")
    print("Available columns:", df.columns.tolist())
    exit()


print("\nText column :", text_column)
print("Label column:", label_column)


# ==========================================
# REMOVE EMPTY VALUES
# ==========================================

df = df.dropna(
    subset=[text_column, label_column]
).copy()


# ==========================================
# PREPARE DATA
# ==========================================

X = df[text_column].astype(str)

y = df[label_column]


# ==========================================
# CONVERT LABELS TO INTEGER
# ==========================================

try:
    y = y.astype(int)
except:
    print("\nConverting labels...")

    y = y.map({
        "fake": 0,
        "Fake": 0,
        "real": 1,
        "Real": 1
    })


# Remove any unknown labels

valid_rows = y.notna()

X = X[valid_rows]

y = y[valid_rows].astype(int)


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining rows:", len(X_train))
print("Testing rows :", len(X_test))


# ==========================================
# LOAD MODEL
# ==========================================

print("\nLoading trained model...")

model = joblib.load(MODEL_PATH)

vectorizer = joblib.load(VECTORIZER_PATH)

print("Model loaded successfully!")


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
print("       WELFAKE MODEL RESULTS")
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
print(" WELFAKE EVALUATION COMPLETED SUCCESSFULLY")
print("==========================================")