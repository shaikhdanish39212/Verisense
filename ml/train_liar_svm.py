import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


# ==========================================
# Dataset paths
# ==========================================

TRAIN_PATH = "dataset/cleaned_liar_train.csv"
VALID_PATH = "dataset/cleaned_liar_valid.csv"
TEST_PATH = "dataset/cleaned_liar_test.csv"


# ==========================================
# Load datasets
# ==========================================

train = pd.read_csv(TRAIN_PATH)
valid = pd.read_csv(VALID_PATH)
test = pd.read_csv(TEST_PATH)

print("\n========== LIAR DATASET LOADED ==========")

print("Training rows:", len(train))
print("Validation rows:", len(valid))
print("Testing rows:", len(test))


# ==========================================
# Prepare data
# ==========================================

X_train = train["clean_text"]
y_train = train["label"]

X_valid = valid["clean_text"]
y_valid = valid["label"]

X_test = test["clean_text"]
y_test = test["label"]


# ==========================================
# TF-IDF
# ==========================================

vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    min_df=2
)

X_train_tfidf = vectorizer.fit_transform(X_train)

X_valid_tfidf = vectorizer.transform(X_valid)

X_test_tfidf = vectorizer.transform(X_test)


print("\n========== TF-IDF ==========")

print("Training shape:", X_train_tfidf.shape)
print("Validation shape:", X_valid_tfidf.shape)
print("Testing shape:", X_test_tfidf.shape)


# ==========================================
# Linear SVM
# ==========================================

svm = LinearSVC(
    random_state=42
)


# ==========================================
# Probability Calibration
# ==========================================

model = CalibratedClassifierCV(
    estimator=svm,
    method="sigmoid",
    cv=5
)


# ==========================================
# Train model
# ==========================================

print("\n========== TRAINING LIAR SVM ==========")

model.fit(
    X_train_tfidf,
    y_train
)

print("LIAR SVM training completed!")


# ==========================================
# Validation
# ==========================================

valid_pred = model.predict(X_valid_tfidf)

valid_accuracy = accuracy_score(
    y_valid,
    valid_pred
)

print("\n========== VALIDATION RESULTS ==========")

print(
    f"Validation Accuracy: {valid_accuracy * 100:.2f}%"
)


# ==========================================
# Test predictions
# ==========================================

test_pred = model.predict(X_test_tfidf)

test_accuracy = accuracy_score(
    y_test,
    test_pred
)


# ==========================================
# Test results
# ==========================================

print("\n========== LIAR TEST RESULTS ==========")

print(
    f"Test Accuracy: {test_accuracy * 100:.2f}%"
)


# ==========================================
# Classification report
# ==========================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        test_pred,
        target_names=["Fake", "Real"]
    )
)


# ==========================================
# Confusion Matrix
# ==========================================

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        test_pred
    )
)


# ==========================================
# Save model
# ==========================================

joblib.dump(
    model,
    "../backend/model/liar_svm_model.joblib"
)

joblib.dump(
    vectorizer,
    "../backend/model/liar_tfidf_vectorizer.joblib"
)


# ==========================================
# Finished
# ==========================================

print("\n========== FILES SAVED ==========")

print("Model: ../backend/model/liar_svm_model.joblib")

print(
    "Vectorizer: ../backend/model/liar_tfidf_vectorizer.joblib"
)

print("\nLIAR MODEL TRAINING COMPLETED SUCCESSFULLY!")