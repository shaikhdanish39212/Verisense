import pandas as pd

# Dataset path
DATASET_PATH = "dataset/WELFake_Dataset.csv"

# Load dataset
df = pd.read_csv(DATASET_PATH)

print("\n========== DATASET INFORMATION ==========\n")

# Number of rows and columns
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

# Column names
print("\nColumns:")
print(df.columns.tolist())

# First 5 rows
print("\n========== FIRST 5 ROWS ==========\n")
print(df.head())

# Missing values
print("\n========== MISSING VALUES ==========\n")
print(df.isnull().sum())

# Duplicate rows
print("\n========== DUPLICATES ==========\n")
print("Duplicate rows:", df.duplicated().sum())

# Label distribution
print("\n========== LABEL DISTRIBUTION ==========\n")
print(df["label"].value_counts())

# Label percentages
print("\n========== LABEL PERCENTAGES ==========\n")
print(df["label"].value_counts(normalize=True) * 100)

print("\n========== SAMPLE TITLES ==========")

for i, row in df.head(10).iterrows():
    print("\nTitle:", row["title"])
    print("Label:", row["label"])