# VeriSense — Misinformation Detection System

![VeriSense](frontend/public/logo.png)

**VeriSense** is an advanced NLP-based misinformation detection system that uses machine learning to automatically classify and identify potentially false or misleading textual content.

## 🎯 Features

- **Dual ML Models**: 
  - **Hybrid SVM** (WELFake): 98.65% accuracy on news articles
  - **LIAR SVM**: 61.17% accuracy on political claims
  
- **User Authentication**: Secure JWT-based login/registration system
- **Prediction History**: Track all past analyses with detailed results
- **Performance Dashboard**: Real-time statistics and model accuracy metrics
- **Professional UI**: Dark theme with neon branding and smooth animations
- **Real-time Feedback**: Instant classification results with confidence scores

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 8** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **uvicorn** - ASGI server
- **PostgreSQL** - Database
- **scikit-learn** - ML models (SVM + TF-IDF)
- **python-jose** - JWT authentication
- **passlib** - Password hashing

### ML Pipeline
- **scikit-learn SVM** - Support Vector Machines
- **TF-IDF Vectorizer** - Text feature extraction
- **joblib** - Model serialization

---

## 📋 Prerequisites

- **Python 3.11+**
- **Node.js 18+** (LTS)
- **PostgreSQL 13+**
- **Git**

---

## 🚀 Installation & Setup

### 1️⃣ Clone & Navigate

```bash
git clone <repository-url>
cd "Misinformation Detection"
```

### 2️⃣ Backend Setup

#### Create Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment
Create `.env` file in `backend/` folder:
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/verisense
JWT_SECRET=verisense_2026_very_long_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### Initialize Database
```bash
# Create database (if not exists)
psql -U postgres -c "CREATE DATABASE verisense;"

# The backend will create tables on first run
```

#### Run Backend Server
```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://127.0.0.1:8000**

---

### 2️⃣ Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Run Development Server
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📚 API Documentation

### Base URL
```
http://127.0.0.1:8000
```

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### Get Current User
```http
GET /me
Authorization: Bearer <token>
```

---

### Prediction Endpoints

#### Predict (WELFake Model)
```http
POST /predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "The earth is flat and NASA is lying to us."
}
```

**Response:**
```json
{
  "prediction": "fake",
  "confidence": 0.95,
  "model": "Hybrid SVM",
  "dataset": "WELFake",
  "accuracy": "98.65%"
}
```

#### Predict (LIAR Model)
```http
POST /predict-liar
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "The government announced a new climate initiative."
}
```

**Response:**
```json
{
  "prediction": "true",
  "confidence": 0.78,
  "model": "LIAR SVM",
  "dataset": "LIAR",
  "accuracy": "61.17%"
}
```

---

### History Endpoints

#### Get All Predictions
```http
GET /history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "predictions": [
    {
      "id": 1,
      "user_id": 1,
      "text": "Sample text...",
      "model": "welfake",
      "prediction": "fake",
      "confidence": 0.95,
      "timestamp": "2026-08-15T10:30:00"
    }
  ]
}
```

#### Delete Prediction
```http
DELETE /history/{prediction_id}
Authorization: Bearer <token>
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | 60 |

### Model Information

#### WELFake Model (Default)
- **Accuracy**: 98.65%
- **Dataset**: WELFake Dataset
- **Best for**: News articles, general text
- **File**: `backend/model/svm_model.joblib`

#### LIAR Model
- **Accuracy**: 61.17%
- **Dataset**: LIAR Dataset
- **Best for**: Political claims, speeches
- **File**: `backend/model/liar_svm_model.joblib`

---

## 📁 Project Structure

```
Misinformation Detection/
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css           # Styling
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/
│   │   ├── logo.png          # VeriSense logo
│   │   └── favicon.png       # Browser favicon
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Configuration file
│   └── model/
│       ├── svm_model.joblib           # WELFake model
│       ├── tfidf_vectorizer.joblib    # WELFake vectorizer
│       ├── liar_svm_model.joblib      # LIAR model
│       └── liar_tfidf_vectorizer.joblib # LIAR vectorizer
│
├── ml/
│   ├── train_model.py        # WELFake model training
│   ├── train_liar_svm.py     # LIAR model training
│   ├── predict.py            # Prediction script
│   ├── evaluate_welfake.py   # Model evaluation
│   └── dataset/              # Training datasets
│
└── README.md                 # This file
```

---

## 🎮 Usage

### 1. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
.venv\Scripts\activate  # Windows
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Open Application
Visit: **http://localhost:5173**

### 3. Register & Login
- Click "Sign Up" to create account
- Enter email and 8+ character password
- Login with credentials

### 4. Analyze Text
- Select model (WELFake or LIAR)
- Paste text to analyze
- Click "Analyze"
- View results and confidence score

### 5. View History
- Navigate to "History" section
- See all past predictions
- Click any prediction to re-analyze
- Delete unwanted entries

---

## 🧪 Testing

### Frontend Build
```bash
cd frontend
npm run build
```

### Backend Health Check
```bash
curl http://127.0.0.1:8000/docs
```

This opens FastAPI's interactive Swagger documentation.

---

## 🔐 Security Notes

- **Passwords** are hashed using bcrypt
- **JWT tokens** expire after 60 minutes
- **CORS** is configured to allow only localhost
- **Database credentials** should be in `.env` (never commit!)
- Add `.env` to `.gitignore`

---

## 📊 Performance

| Metric | Value |
|---|---|
| Frontend Build Size | ~229 KB (JS) + 35 KB (CSS) |
| Model Load Time | ~2-3 seconds |
| Prediction Time | ~50-100 ms |
| Database Query Time | <50 ms |

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
# Format: postgresql://user:password@host:port/database
```

### CORS Errors
- Ensure frontend is on `http://localhost:5173`
- Ensure backend is on `http://127.0.0.1:8000`
- Check backend `ALLOWED_ORIGINS` in `main.py`

### Models Not Loading
```bash
# Verify model files exist
ls backend/model/
# Should show: *.joblib files
```

### Port Already in Use
```bash
# Change port in command
uvicorn main:app --reload --port 8001
```

---

## 📝 Environment Setup Guide

### Windows
```powershell
# Create virtual environment
python -m venv backend\.venv

# Activate
backend\.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### macOS/Linux
```bash
# Create virtual environment
python3 -m venv backend/.venv

# Activate
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Update `JWT_SECRET` with strong random key
- [ ] Use PostgreSQL with strong authentication
- [ ] Set `ALLOWED_ORIGINS` to production domain
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up logging
- [ ] Configure backup strategy
- [ ] Use environment variables (not .env)

---

## 📄 License

This project is part of MSC Computer Science curriculum.

---

## 👨‍💻 Authors

**VeriSense Development Team**

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review API documentation at `http://127.0.0.1:8000/docs`
3. Check browser console for frontend errors

---

## 🎓 Educational Value

This project demonstrates:
- ✅ Full-stack web development (React + FastAPI)
- ✅ Machine learning integration
- ✅ Database design & management
- ✅ Authentication & authorization
- ✅ API design & documentation
- ✅ NLP & text classification
- ✅ User interface/experience design

---

**Happy detecting! 🎉**
