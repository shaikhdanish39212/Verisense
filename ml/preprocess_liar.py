import pandas as pd
import re


# ==========================================
# Dataset paths
# ==========================================

TRAIN_PATH = "dataset/train.tsv"
VALID_PATH = "dataset/valid.tsv"
TEST_PATH = "dataset/test.tsv"


# ==========================================
# Text cleaning function
# ==========================================

def clean_text(text):

    text = str(text)

    # Convert to lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)

    # Remove HTML tags
    text = re.sub(r"<.*?>", "", text)

    # Keep letters and spaces
    text = re.sub(r"[^a-zA-Z\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


# ==========================================
# LIAR label mapping
# ==========================================

label_mapping = {

    # Fake / misleading
    "false": 0,
    "barely-true": 0,
    "pants-fire": 0,

    # Real / more truthful
    "true": 1,
    "mostly-true": 1,
    "half-true": 1
}


# ==========================================
# Process one LIAR file
# ==========================================

def process_file(input_path, output_path):

    df = pd.read_csv(
        input_path,
        sep="\t",
        header=None
    )

    print("\nProcessing:", input_path)

    # LIAR column 1 = original label
    # LIAR column 2 = statement
    df["original_label"] = df[1]
    df["text"] = df[2]

    # Remove missing statements or labels
    df = df.dropna(
        subset=["text", "original_label"]
    )

    # Convert 7-class label into binary label
    df["label"] = df["original_label"].map(
        label_mapping
    )

    # Remove labels that were not mapped
    df = df.dropna(
        subset=["label"]
    )

    # Convert label to integer
    df["label"] = df["label"].astype(int)

    # Clean statement text
    df["clean_text"] = df["text"].apply(
        clean_text
    )

    # Remove empty text
    df = df[
        df["clean_text"].str.len() > 0
    ]

    # Keep required columns
    result = df[
        [
            "text",
            "original_label",
            "clean_text",
            "label"
        ]
    ]

    # Save
    result.to_csv(
        output_path,
        index=False
    )

    print("Rows:", len(result))

    print("\nOriginal labels:")
    print(
        result["original_label"].value_counts()
    )

    print("\nBinary labels:")
    print(
        result["label"].value_counts()
    )

    print("\nSaved:")
    print(output_path)


# ==========================================
# Process TRAIN
# ==========================================

process_file(
    TRAIN_PATH,
    "dataset/cleaned_liar_train.csv"
)


# ==========================================
# Process VALIDATION
# ==========================================

process_file(
    VALID_PATH,
    "dataset/cleaned_liar_valid.csv"
)


# ==========================================
# Process TEST
# ==========================================

process_file(
    TEST_PATH,
    "dataset/cleaned_liar_test.csv"
)


# ==========================================
# Completed
# ==========================================

print("\n========================================")
print("LIAR PREPROCESSING COMPLETED SUCCESSFULLY!")
print("========================================")

print("\nLabel meaning:")
print("0 = Fake / Potential Misinformation")
print("1 = Real / Likely Authentic")