import pandas as pd


# ==========================================
# Dataset paths
# ==========================================

TRAIN_PATH = "dataset/train.tsv"
VALID_PATH = "dataset/valid.tsv"
TEST_PATH = "dataset/test.tsv"


# ==========================================
# Load LIAR dataset
# ==========================================

train = pd.read_csv(
    TRAIN_PATH,
    sep="\t",
    header=None
)

valid = pd.read_csv(
    VALID_PATH,
    sep="\t",
    header=None
)

test = pd.read_csv(
    TEST_PATH,
    sep="\t",
    header=None
)


# ==========================================
# Dataset Information
# ==========================================

print("\n========== LIAR DATASET INFORMATION ==========")

print("\nTraining rows:", len(train))
print("Validation rows:", len(valid))
print("Testing rows:", len(test))


print("\n========== NUMBER OF COLUMNS ==========")

print("Columns:", train.shape[1])


# ==========================================
# First 5 rows
# ==========================================

print("\n========== FIRST 5 TRAINING ROWS ==========")

print(train.head())


# ==========================================
# Column information
# ==========================================

print("\n========== COLUMN INFORMATION ==========")

for i, column in enumerate(train.columns):
    print(i, ":", column)


# ==========================================
# Label Distribution
# ==========================================

print("\n========== LABEL DISTRIBUTION ==========")

print(train[1].value_counts())


# ==========================================
# Sample statements
# ==========================================

print("\n========== SAMPLE STATEMENTS ==========")

for i in range(min(10, len(train))):

    print("\nStatement:", train.iloc[i, 2])
    print("Label:", train.iloc[i, 1])


print("\n========== INSPECTION COMPLETED ==========")