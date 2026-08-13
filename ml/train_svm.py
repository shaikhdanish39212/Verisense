import pandas as pd
import re
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ==========================================
# Dataset
# ==========================================

DATA_PATH = "dataset/WELFake_Dataset.csv"


# ==========================================
# Load dataset
# ==========================================

df = pd.read_csv(
    DATA_PATH,
    usecols=["title", "text", "label"]
)

print("\n========== DATASET LOADED ==========")

print("Rows:", len(df))
print("Columns:", list(df.columns))


# ==========================================
# Remove missing values
# ==========================================

df = df.dropna(
    subset=["title", "text", "label"]
)

print("\nAfter removing missing values:")
print("Rows:", len(df))


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
# Create title and full-text versions
# ==========================================

df["clean_title"] = df["title"].apply(
    clean_text
)

df["clean_text"] = (
    df["title"].fillna("")
    + " "
    + df["text"].fillna("")
).apply(clean_text)


# ==========================================
# Remove empty records
# ==========================================

df = df[
    (df["clean_title"].str.len() > 0)
    &
    (df["clean_text"].str.len() > 0)
]


print("\n========== FINAL DATA ==========")

print("Rows:", len(df))

print("\nLabel distribution:")
print(df["label"].value_counts())

print("\nLabel meaning:")
print("0 = Fake")
print("1 = Real")


# ==========================================
# Train / Test Split
# ==========================================

train_df, test_df = train_test_split(
    df,
    test_size=0.20,
    random_state=42,
    stratify=df["label"]
)


print("\n========== DATA SPLIT ==========")

print("Training articles:", len(train_df))
print("Testing articles:", len(test_df))


# ==========================================
# AUGMENT TRAINING DATA
#
# Each training record produces:
#
# 1. Title-only sample
# 2. Title + article sample
#
# This teaches the model to handle both
# short claims and complete news articles.
# ==========================================

train_title = train_df["clean_title"]

train_full = train_df["clean_text"]

X_train = pd.concat(
    [
        train_title,
        train_full
    ],
    ignore_index=True
)

y_train = pd.concat(
    [
        train_df["label"],
        train_df["label"]
    ],
    ignore_index=True
)


print("\n========== AUGMENTED TRAINING DATA ==========")

print("Title samples:", len(train_title))
print("Full-text samples:", len(train_full))
print("Total training samples:", len(X_train))


# ==========================================
# Test datasets
# ==========================================

X_test_title = test_df["clean_title"]

X_test_full = test_df["clean_text"]

y_test = test_df["label"]


# ==========================================
# TF-IDF
# ==========================================

vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    min_df=2,
    sublinear_tf=True
)


# Fit ONLY on training data
X_train_tfidf = vectorizer.fit_transform(
    X_train
)

X_test_title_tfidf = vectorizer.transform(
    X_test_title
)

X_test_full_tfidf = vectorizer.transform(
    X_test_full
)


print("\n========== TF-IDF ==========")

print(
    "Training TF-IDF shape:",
    X_train_tfidf.shape
)

print(
    "Title testing shape:",
    X_test_title_tfidf.shape
)

print(
    "Full-text testing shape:",
    X_test_full_tfidf.shape
)


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
    cv=3
)


# ==========================================
# Train
# ==========================================

print("\n========== TRAINING HYBRID SVM ==========")

model.fit(
    X_train_tfidf,
    y_train
)

print("Hybrid SVM training completed!")


# ==========================================
# TITLE EVALUATION
# ==========================================

title_pred = model.predict(
    X_test_title_tfidf
)

title_accuracy = accuracy_score(
    y_test,
    title_pred
)


print("\n========== TITLE RESULTS ==========")

print(
    f"Title Accuracy: {title_accuracy * 100:.2f}%"
)

print("\nTitle Classification Report:")

print(
    classification_report(
        y_test,
        title_pred,
        target_names=["Fake", "Real"]
    )
)

print("\nTitle Confusion Matrix:")

print(
    confusion_matrix(
        y_test,
        title_pred
    )
)


# ==========================================
# FULL ARTICLE EVALUATION
# ==========================================

full_pred = model.predict(
    X_test_full_tfidf
)

full_accuracy = accuracy_score(
    y_test,
    full_pred
)


print("\n========== FULL ARTICLE RESULTS ==========")

print(
    f"Full Article Accuracy: {full_accuracy * 100:.2f}%"
)

print("\nFull Article Classification Report:")

print(
    classification_report(
        y_test,
        full_pred,
        target_names=["Fake", "Real"]
    )
)

print("\nFull Article Confusion Matrix:")

print(
    confusion_matrix(
        y_test,
        full_pred
    )
)


# ==========================================
# Save model
# ==========================================

joblib.dump(
    model,
    "../backend/model/svm_model.joblib"
)

joblib.dump(
    vectorizer,
    "../backend/model/tfidf_vectorizer.joblib"
)


# ==========================================
# Finished
# ==========================================

print("\n========== FILES SAVED ==========")

print(
    "Model: ../backend/model/svm_model.joblib"
)

print(
    "Vectorizer: ../backend/model/tfidf_vectorizer.joblib"
)

print("\nHybrid SVM training completed successfully!")