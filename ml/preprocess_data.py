import pandas as pd
import re

# ==========================================
# Dataset path
# ==========================================

DATASET_PATH = "dataset/WELFake_Dataset.csv"

# ==========================================
# Load dataset
# ==========================================

df = pd.read_csv(
    DATASET_PATH,
    usecols=["title", "text", "label"]
)

print("\n========== ORIGINAL DATA ==========")
print("Rows:", len(df))
print("Columns:", df.columns.tolist())


# ==========================================
# Remove missing values
# ==========================================

df = df.dropna(
    subset=["title", "text", "label"]
)

print("\n========== AFTER REMOVING MISSING VALUES ==========")
print("Rows:", len(df))


# ==========================================
# Remove duplicates
# ==========================================

df = df.drop_duplicates(
    subset=["title", "text"]
)

print("\n========== AFTER REMOVING DUPLICATES ==========")
print("Rows:", len(df))


# ==========================================
# Text cleaning function
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
# Clean title and article
# ==========================================

df["clean_title"] = df["title"].apply(clean_text)

df["clean_article"] = df["text"].apply(clean_text)


# ==========================================
# Give more importance to title
# ==========================================

df["clean_text"] = (
    df["clean_title"] + " " +
    df["clean_title"] + " " +
    df["clean_article"]
)


# ==========================================
# Remove empty text
# ==========================================

df = df[
    df["clean_text"].str.len() > 0
]


# ==========================================
# Final data
# ==========================================

print("\n========== FINAL DATA ==========")
print("Rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nLabel distribution:")
print(df["label"].value_counts())

print("\nLabel meaning:")
print("0 = Fake")
print("1 = Real")


# ==========================================
# Save cleaned dataset
# ==========================================

OUTPUT_PATH = "dataset/cleaned_WELFake.csv"

df[
    ["clean_text", "label"]
].to_csv(
    OUTPUT_PATH,
    index=False
)

print("\n========== FILE SAVED ==========")
print("Cleaned dataset:")
print(OUTPUT_PATH)

print("\nTitle-weighted preprocessing completed successfully!")