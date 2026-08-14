# VeriSense — Misinformation Detection using NLP

## 📌 Project Overview

VeriSense is an NLP-powered web application designed to detect potentially misleading or false textual content using Natural Language Processing (NLP) and Machine Learning.

The system analyzes submitted news claims or textual content and classifies them as:

- Potential Misinformation
- Likely Authentic

The application also provides a confidence score and stores authenticated users' prediction history in a PostgreSQL database.

---

## 🚀 Key Features

- User Registration and Login
- JWT-based Authentication
- Multiple Machine Learning Detection Models
- WELFake Dataset-based News Detection
- LIAR Dataset-based Political Claim Detection
- Prediction Confidence Score
- PostgreSQL Prediction History
- Delete Individual History Records
- Clear Prediction History
- Reuse Previous Predictions
- Model Performance Metrics
- Modern Responsive User Interface
- Authentication-protected Prediction APIs
- User-specific Prediction History
- Secure Password Hashing

---

## 🧠 Machine Learning Models

### 1. WELFake — Hybrid SVM

| Metric    |          Result |
| --------- | --------------: |
| Dataset   | WELFake Dataset |
| Model     |      Hybrid SVM |
| Accuracy  |          98.65% |
| Precision |          98.16% |
| Recall    |          98.85% |
| F1 Score  |          98.51% |

The WELFake model is designed primarily for news articles and general textual content classification.

### 2. LIAR — SVM

| Metric    |       Result |
| --------- | -----------: |
| Dataset   | LIAR Dataset |
| Model     |          SVM |
| Accuracy  |       61.17% |
| Precision |       61.73% |
| Recall    |       81.79% |
| F1 Score  |       70.36% |

The LIAR model is designed primarily for political claim classification.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │       User           │
                    │      Browser         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │   Vite + Tailwind    │
                    └──────────┬───────────┘
                               │
                         REST API / HTTP
                               │
                               ▼
                    ┌──────────────────────┐
                    │   FastAPI Backend    │
                    │ JWT Authentication   │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐
       │ Machine Learning │          │    PostgreSQL    │
       │      Models      │          │     Database     │
       └────────┬─────────┘          └──────────────────┘
                │
          ┌─────┴─────┐
          │           │
          ▼           ▼
      WELFake       LIAR
        SVM          SVM
```

---

## 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript
- Vite
- Tailwind CSS
- Lucide React

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Python-Jose
- Passlib
- Bcrypt

### Machine Learning

- Scikit-learn
- NumPy
- Pandas
- Joblib
- TF-IDF Vectorization
- Support Vector Machine (SVM)

### Database

- PostgreSQL
- Psycopg2

### Security

- JWT Authentication
- Password Hashing using bcrypt
- Protected API Endpoints
- Environment Variables for Secrets
- User-specific Database Records

---

## 📁 Project Structure

```text
Misinformation Detection/
│
├── backend/
│   ├── .env
│   ├── main.py
│   ├── requirements.txt
│   │
│   └── model/
│       ├── svm_model.joblib
│       ├── tfidf_vectorizer.joblib
│       ├── liar_svm_model.joblib
│       └── liar_tfidf_vectorizer.joblib
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── logo.png
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   └── dataset/
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

Before running the project, make sure the following are installed:

- Python
- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd "Misinformation Detection"
```

### 2. Backend Setup

Create a Python virtual environment:

```bash
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r backend/requirements.txt
```

### 3. Environment Variables

Create a `.env` file inside the `backend` folder:

```text
backend/.env
```

Add:

```env
DATABASE_URL=your_postgresql_database_url
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Do not commit the `.env` file to GitHub.

### 4. PostgreSQL Database

Create a PostgreSQL database for the project.

The application uses PostgreSQL to store:

- User accounts
- Password hashes
- Prediction history
- Prediction confidence
- Model information
- Dataset information
- Prediction timestamps

Prediction history is associated with the authenticated user's ID. This ensures that users can access only their own prediction history.

### 5. Run the Backend

```bash
uvicorn backend.main:app --reload
```

The backend API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 6. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔌 API Endpoints

| Method | Endpoint        | Authentication | Purpose                       |
| ------ | --------------- | -------------- | ----------------------------- |
| GET    | `/`             | No             | API status                    |
| GET    | `/health`       | No             | Health check                  |
| POST   | `/register`     | No             | Create a user account         |
| POST   | `/login`        | No             | Authenticate a user           |
| GET    | `/me`           | Yes            | Get current user              |
| POST   | `/predict`      | Yes            | WELFake prediction            |
| POST   | `/predict-liar` | Yes            | LIAR prediction               |
| GET    | `/history`      | Yes            | Get user's prediction history |
| DELETE | `/history/{id}` | Yes            | Delete one history record     |
| DELETE | `/history`      | Yes            | Delete all user history       |

---

# 🔐 Authentication

VeriSense uses JWT-based authentication.

### Authentication Flow

```text
User
  │
  ▼
Register / Login
  │
  ▼
FastAPI Authentication
  │
  ▼
JWT Access Token
  │
  ▼
Frontend Local Storage
  │
  ▼
Authenticated API Requests
  │
  ▼
Protected Prediction & History
```

After successful login, the backend generates an access token. The frontend stores the token locally and sends it with protected API requests.

Protected operations include:

- Prediction
- Prediction history
- Delete history
- Clear history
- Current user information

---

# 🔒 Password Security

Passwords are never stored as plain text.

```text
Plain Password
      │
      ▼
bcrypt Hashing
      │
      ▼
Password Hash
      │
      ▼
PostgreSQL
```

During login, the entered password is compared against the stored password hash.

---

# 🧠 Prediction Workflow

```text
User enters text
       │
       ▼
React Frontend
       │
       ▼
JWT Authentication
       │
       ▼
FastAPI Backend
       │
       ▼
Text Preprocessing
       │
       ▼
TF-IDF Vectorization
       │
       ▼
SVM Classification
       │
       ▼
Prediction + Confidence
       │
       ▼
PostgreSQL History
       │
       ▼
Result displayed to user
```

---

# 📰 WELFake Prediction

The WELFake model is accessed through:

```text
POST /predict
```

The model uses:

- Text preprocessing
- TF-IDF vectorization
- Hybrid SVM classification

The result contains:

- Prediction
- Label
- Confidence score

---

# 🏛️ LIAR Prediction

The LIAR model is accessed through:

```text
POST /predict-liar
```

The model uses:

- Text preprocessing
- TF-IDF vectorization
- SVM classification

The result contains:

- Prediction
- Label
- Confidence score

---

# 📊 Model Performance

## WELFake

```text
Accuracy   : 98.65%
Precision  : 98.16%
Recall     : 98.85%
F1 Score   : 98.51%
```

## LIAR

```text
Accuracy   : 61.17%
Precision  : 61.73%
Recall     : 81.79%
F1 Score   : 70.36%
```

These metrics are displayed in the application's Model Performance section.

---

# 🗄️ Prediction History

After a successful prediction, the application stores:

- User ID
- Submitted text
- Prediction
- Confidence
- Model
- Dataset
- Model accuracy
- Prediction timestamp

Users can:

- View recent analyses
- Reuse a previous text
- Delete an individual prediction
- Clear their complete prediction history

The history is linked to the authenticated user.

---

# 🎨 User Interface

The VeriSense frontend provides a modern dark-themed interface containing:

### Navigation

- Analyze
- History
- Performance
- How It Works
- About
- Login / Logout
- System Status

### Analyzer

Users can:

- Select a detection model
- Enter textual content
- Analyze the content
- View prediction confidence
- Try example claims

### Result

The result section displays:

- Classification result
- Confidence percentage
- Confidence progress bar
- Detection model
- Dataset
- Model accuracy
- Important interpretation note

---

# 🔄 History Management

Authenticated users can manage their prediction history.

### Use Previous Text

A previous prediction can be loaded back into the analyzer using:

```text
Use this text again →
```

### Delete Individual Record

Individual prediction records can be deleted using:

```text
Delete
```

### Clear All History

All prediction history can be permanently deleted using:

```text
Clear History
```

---

# 📈 Model Performance Section

The application provides a dedicated performance section displaying:

- Accuracy
- Precision
- Recall
- F1 Score

for both machine learning models.

This allows users to compare the evaluation results of the WELFake and LIAR models.

---

# 🔍 Health Check

The backend provides:

```text
GET /health
```

It checks:

- API status
- WELFake model status
- LIAR model status
- PostgreSQL database connection

Example response:

```json
{
  "status": "healthy",
  "welfake_model": "loaded",
  "liar_model": "loaded",
  "database": "connected"
}
```

---

# ⚠️ Important Limitation

VeriSense provides an **ML-based classification**, not independent fact verification.

The system learns patterns from the training datasets and uses those patterns to classify new textual content.

Therefore, a prediction should not be interpreted as definitive proof that a claim is true or false.

A result such as:

```text
Potential Misinformation
```

means that the model identified patterns associated with misinformation in its learned data.

Similarly:

```text
Likely Authentic
```

does not guarantee that the information is factually correct.

---

# 🎯 Project Objective

The primary objective of VeriSense is to demonstrate how Natural Language Processing and Machine Learning can be integrated into a practical web application for detecting potentially misleading textual content.

The project combines:

```text
NLP
+
Machine Learning
+
TF-IDF
+
SVM
+
FastAPI
+
React
+
JWT Authentication
+
PostgreSQL
```

into a single end-to-end misinformation detection system.

---

# 🌐 Application Flow

```text
                    VeriSense
                       │
                       ▼
                User Authentication
                       │
              ┌────────┴────────┐
              │                 │
           Login             Register
              │                 │
              └────────┬────────┘
                       │
                       ▼
                 Main Analyzer
                       │
              ┌────────┴────────┐
              │                 │
           WELFake             LIAR
              │                 │
              ▼                 ▼
          Hybrid SVM          SVM
              │                 │
              └────────┬────────┘
                       │
                       ▼
              Prediction Result
                       │
                       ▼
                Confidence Score
                       │
                       ▼
              PostgreSQL History
```

---

# 🧪 Example Usage

### Example Input

```text
Scientists have discovered a new treatment that completely cures every type of cancer.
```

### Possible Output

```text
Potential Misinformation

Confidence: XX.XX%
```

The exact prediction and confidence depend on the trained machine learning model.

---

# 🛡️ Security Considerations

The project implements:

- JWT-based authentication
- Password hashing
- Protected API endpoints
- User-specific prediction history
- Environment variables for sensitive configuration
- `.env` excluded from version control
- Input length restrictions
- Email validation
- Database parameterized queries

---

# 📦 Backend Dependencies

The backend uses Python packages including:

```text
fastapi
uvicorn
pydantic
numpy
pandas
scikit-learn
scipy
joblib
psycopg2-binary
python-dotenv
python-jose
passlib
bcrypt
```

The exact versions are maintained in:

```text
backend/requirements.txt
```

---

# 📦 Frontend Dependencies

The frontend uses:

```text
react
react-dom
vite
tailwindcss
@tailwindcss/vite
lucide-react
```

The exact versions are maintained in:

```text
frontend/package.json
```

---

# 🚫 Environment and Generated Files

The following files and directories should not be committed to the repository:

```text
.env
.env.*
.venv/
venv/
node_modules/
dist/
__pycache__/
*.pyc
```

These are excluded through `.gitignore`.

---

# 🔮 Future Scope

Possible future improvements include:

- Real-time news verification
- Integration with external fact-checking APIs
- Explainable AI features
- Advanced NLP transformer models
- Multilingual misinformation detection
- Browser extension
- News source credibility analysis
- URL-based article analysis
- Image and video misinformation detection
- Cloud deployment
- Continuous model retraining
- Larger and more diverse datasets

These features are outside the current implementation.

---

# 📚 Academic Purpose

VeriSense is developed as an academic project demonstrating the practical integration of:

- Natural Language Processing
- Machine Learning
- Web Development
- REST APIs
- Authentication
- Database Management
- Software Engineering

The project provides an end-to-end implementation where machine learning models are integrated with a functional web application.

---

# 📄 License

This project is developed for academic and educational purposes.

---

## VeriSense

**NLP · Detect · Verify**

_Misinformation Detection using Natural Language Processing_
