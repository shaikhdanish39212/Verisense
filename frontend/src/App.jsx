import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  FileText,
  Brain,
  BarChart3,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Trash2,
  LogIn,
  LogOut,
  User,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "verisense_access_token";
const USER_KEY = "verisense_user";

function App() {
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const isAuthenticated = Boolean(token && user);

  // ============================================================
  // MAIN APP STATE
  // ============================================================

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [selectedModel, setSelectedModel] = useState("welfake");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ============================================================
  // MODEL INFORMATION
  // ============================================================

  const modelInfo = {
    welfake: {
      name: "Hybrid SVM",
      dataset: "WELFake Dataset",
      accuracy: "98.65%",
      endpoint: `${API_BASE_URL}/predict`,
      description:
        "Designed for news article and general textual content classification.",
    },

    liar: {
      name: "LIAR SVM",
      dataset: "LIAR Dataset",
      accuracy: "61.17%",
      endpoint: `${API_BASE_URL}/predict-liar`,
      description: "Designed primarily for political claim classification.",
    },
  };

  const currentModel = modelInfo[selectedModel];

  // ============================================================
  // PERFORMANCE DATA
  // ============================================================

  const performanceData = {
    welfake: {
      name: "WELFake — Hybrid SVM",
      dataset: "WELFake Dataset",
      accuracy: "98.65%",
      precision: "98.16%",
      recall: "98.85%",
      f1: "98.51%",
    },

    liar: {
      name: "LIAR — SVM",
      dataset: "LIAR Dataset",
      accuracy: "61.17%",
      precision: "61.73%",
      recall: "81.79%",
      f1: "70.36%",
    },
  };

  // ============================================================
  // EXAMPLES
  // ============================================================

  const welfakeExamples = [
    "Scientists have discovered a new treatment that completely cures every type of cancer.",
    "The government announced a new education policy for schools.",
    "Drinking a glass of warm water can prevent all viral infections.",
  ];

  const liarExamples = [
    "The government announced a new education policy for schools.",
    "The president announced a new economic policy today.",
    "The government has created thousands of new jobs this year.",
  ];

  const examples = selectedModel === "welfake" ? welfakeExamples : liarExamples;

  // ============================================================
  // AUTH HEADER
  // ============================================================

  const getAuthHeaders = () => {
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken("");
    setUser(null);

    setHistory([]);
    setResult(null);
    setText("");

    setError("You have been logged out.");
  };

  // ============================================================
  // VERIFY EXISTING TOKEN
  // ============================================================

  const verifySession = async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (!savedToken) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Session expired");
      }

      const data = await response.json();

      setToken(savedToken);
      setUser(data.user);

      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (err) {
      console.error("Session verification error:", err);

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      setToken("");
      setUser(null);
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.");
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);

      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      setAuthEmail("");
      setAuthPassword("");
      setAuthError("");
      setAuthMessage("");

      setShowAuth(false);

      await loadHistory(data.access_token);
    } catch (err) {
      console.error("Login error:", err);

      setAuthError(err.message || "Unable to login. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please enter your email and password.");
      return;
    }

    if (authPassword.length < 8) {
      setAuthError("Password must contain at least 8 characters.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create account.");
      }

      setAuthMessage("Account created successfully. You can now login.");

      setAuthMode("login");
      setAuthPassword("");
    } catch (err) {
      console.error("Registration error:", err);

      setAuthError(err.message || "Unable to create account.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ============================================================
  // OPEN LOGIN
  // ============================================================

  const openLogin = () => {
    setAuthMode("login");
    setAuthError("");
    setAuthMessage("");
    setShowAuth(true);
  };

  // ============================================================
  // OPEN REGISTER
  // ============================================================

  const openRegister = () => {
    setAuthMode("register");
    setAuthError("");
    setAuthMessage("");
    setShowAuth(true);
  };

  // ============================================================
  // CLOSE AUTH
  // ============================================================

  const closeAuth = () => {
    if (authLoading) {
      return;
    }

    setShowAuth(false);
    setAuthError("");
    setAuthMessage("");
  };

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const loadHistory = async (providedToken = null) => {
    const activeToken =
      providedToken || token || localStorage.getItem(TOKEN_KEY);

    if (!activeToken) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = await response.json();

      setHistory(data.history || []);
      setError("");
    } catch (err) {
      console.error("History loading error:", err);

      setError("Unable to load prediction history from the server.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================================
  // INITIAL SESSION
  // ============================================================

  useEffect(() => {
    verifySession();
  }, []);

  // ============================================================
  // LOAD HISTORY AFTER AUTHENTICATION
  // ============================================================

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  // ============================================================
  // ANALYZE TEXT
  // ============================================================

  const handleAnalyze = async () => {
    if (!isAuthenticated) {
      setError("Please login before analyzing text.");
      openLogin();
      return;
    }

    if (!text.trim()) {
      setError("Please enter some text before analyzing.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(currentModel.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          text: text,
        }),
      });

      if (response.status === 401) {
        handleLogout();
        setError("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      if (data.prediction === -1) {
        setError("Please enter some valid text before analyzing.");
        return;
      }

      setResult(data);

      await loadHistory();
    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        "Unable to connect to the prediction server. Make sure FastAPI is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MODEL CHANGE
  // ============================================================

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    setResult(null);
    setError("");
  };

  // ============================================================
  // USE EXAMPLE
  // ============================================================

  const handleExample = (example) => {
    setText(example);
    setResult(null);
    setError("");

    document.getElementById("analyze")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ============================================================
  // CLEAR TEXT
  // ============================================================

  const clearText = () => {
    setText("");
    setResult(null);
    setError("");
  };

  // ============================================================
  // CLEAR ALL HISTORY
  // ============================================================

  const clearHistory = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (history.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all prediction history?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      setHistory([]);
    } catch (err) {
      console.error("Clear history error:", err);

      setError("Unable to clear prediction history from the server.");
    }
  };

  // ============================================================
  // USE HISTORY ITEM
  // ============================================================

  const useHistoryItem = (item) => {
    setText(item.text);

    setSelectedModel(item.dataset === "LIAR Dataset" ? "liar" : "welfake");

    setResult(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // DELETE SINGLE HISTORY ITEM
  // ============================================================

  const deleteHistoryItem = async (id) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete history item");
      }

      setHistory((previousHistory) =>
        previousHistory.filter((item) => item.id !== id),
      );
    } catch (err) {
      console.error("Delete history error:", err);

      setError("Unable to delete this prediction from the server.");
    }
  };

  // ============================================================
  // PREDICTION STATUS
  // ============================================================

  const isFake = result?.prediction === 0;

  // ============================================================
  // CONFIDENCE
  // ============================================================

  const confidence = result?.confidence ? Number(result.confidence) * 100 : 0;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* LOGO */}

          <a href="#" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="VeriSense"
              className="h-10 w-10 shrink-0 rounded-full object-contain overflow-hidden"
            />

            <div className="min-w-0">
              <span className="block text-lg font-bold tracking-tight">
                <span className="text-white">Veri</span>
                <span className="text-blue-400">Sense</span>
              </span>

              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
                NLP · Detect · Verify
              </span>
            </div>
          </a>

          {/* NAVIGATION */}

          <div className="hidden items-center gap-7 text-sm text-slate-400 lg:flex">
            <a href="#analyze" className="transition hover:text-white">
              Analyze
            </a>

            <a href="#history" className="transition hover:text-white">
              History
            </a>

            <a href="#performance" className="transition hover:text-white">
              Performance
            </a>

            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>

            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </div>

          {/* AUTH / SYSTEM */}

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* USER */}

                <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 xl:flex">
                  <User size={13} className="text-blue-400" />

                  <span className="max-w-35 truncate">{user?.email}</span>
                </div>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-red-400/30 hover:text-red-400"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* LOGIN */}

                <button
                  type="button"
                  onClick={openLogin}
                  className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-400/15 hover:text-blue-200"
                >
                  <LogIn size={14} />
                  Login
                </button>
              </>
            )}

            {/* SYSTEM */}

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              System Ready
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 -top-37.5 h-125 w-175 max-w-[90vw] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-28">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-medium text-blue-300">
              <Sparkles size={14} />
              NLP-Powered Misinformation Detection
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Detect misinformation
              <span className="mt-2 block bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                before it spreads.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Analyze news claims and textual content using natural language
              processing and machine learning.
            </p>
          </div>
        </section>

        {/* ====================================================
            ANALYZER
        ==================================================== */}

        <section id="analyze" className="scroll-mt-24 px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Search size={18} className="text-blue-400" />

                      <h2 className="font-semibold">Analyze a claim</h2>
                    </div>

                    <p className="mt-1.5 text-sm text-slate-500">
                      Paste a headline, claim, or news text below.
                    </p>
                  </div>

                  <div className="hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-500 sm:block">
                    NLP Analysis
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Select Detection Model
                  </label>

                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 sm:max-w-sm"
                  >
                    <option value="welfake">
                      WELFake — News Article Detection
                    </option>

                    <option value="liar">
                      LIAR — Political Claim Detection
                    </option>
                  </select>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-blue-400/10 px-3 py-1.5 text-[10px] text-blue-400">
                      Dataset: {currentModel.dataset}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] text-slate-500">
                      Accuracy: {currentModel.accuracy}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setResult(null);
                      setError("");
                    }}
                    maxLength={2000}
                    placeholder={
                      isAuthenticated
                        ? "Paste a news claim or textual content here..."
                        : "Login to analyze news claims..."
                    }
                    className="min-h-52 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-5 pr-12 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {text.length > 0 && (
                    <button
                      type="button"
                      onClick={clearText}
                      className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                      aria-label="Clear text"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {text.length === 0
                      ? "Maximum 2,000 characters"
                      : `${text.length} / 2,000 characters`}
                  </span>

                  <span className="text-slate-600">Text classification</span>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!text.trim() || loading}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none"
                >
                  <Search size={17} />

                  {loading
                    ? "Analyzing..."
                    : isAuthenticated
                      ? "Analyze Text"
                      : "Login to Analyze"}

                  {!loading && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

                <div className="mt-8">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-slate-500" />

                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Try an example
                    </span>
                  </div>

                  <div className="space-y-2">
                    {examples.map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleExample(example)}
                        className="group flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/2 p-3 text-left text-xs leading-5 text-slate-500 transition hover:border-blue-400/20 hover:bg-blue-400/3 hover:text-slate-300"
                      >
                        <ChevronRight
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-700 transition group-hover:text-blue-400"
                        />

                        <span>{example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />

                <p>{error}</p>
              </div>
            )}

            {/* ==================================================
                RESULT
            ================================================== */}

            {result && (
              <div
                className={`mt-5 rounded-3xl border p-5 shadow-xl backdrop-blur-xl sm:p-8 ${
                  isFake
                    ? "border-red-400/20 bg-red-400/4"
                    : "border-emerald-400/20 bg-emerald-400/4"
                }`}
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isFake
                          ? "bg-red-400/10 text-red-400"
                          : "bg-emerald-400/10 text-emerald-400"
                      }`}
                    >
                      {isFake ? (
                        <AlertTriangle size={23} />
                      ) : (
                        <CheckCircle2 size={23} />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Analysis Result
                      </p>

                      <h3
                        className={`mt-2 text-2xl font-bold ${
                          isFake ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {isFake
                          ? "Potential Misinformation"
                          : "Likely Authentic"}
                      </h3>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        {isFake
                          ? "The model detected patterns commonly associated with potentially misleading content."
                          : "The model detected patterns that are more consistent with authentic content."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-37.5 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Confidence
                    </p>

                    <p
                      className={`mt-1 text-2xl font-bold ${
                        isFake ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {confidence.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-blue-400/10 bg-blue-400/3 p-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-blue-400" />

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Detection Model Used
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-medium text-slate-300">
                    {currentModel.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {currentModel.description}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Prediction confidence
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        isFake ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {confidence.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFake ? "bg-red-400" : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(Math.max(confidence, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="my-6 h-px bg-white/10" />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/5 bg-white/2 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Model
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.name}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/2 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Dataset
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.dataset}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/2 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Model Accuracy
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.accuracy}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/3 p-4">
                  <p className="text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-amber-400">
                      Important:
                    </span>{" "}
                    This is an AI/ML classification result based on patterns
                    learned from training data. It does not independently verify
                    whether the claim is factually true or false.
                  </p>
                </div>
              </div>
            )}

            {/* ==================================================
                HISTORY
            ================================================== */}

            <section id="history" className="mt-16 scroll-mt-24">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    History
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">Recent Analyses</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Predictions are permanently stored in PostgreSQL.
                  </p>
                </div>

                {isAuthenticated && history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500 transition hover:border-red-400/20 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                    Clear History
                  </button>
                )}
              </div>

              {!isAuthenticated && (
                <div className="rounded-2xl border border-dashed border-blue-400/20 bg-blue-400/5 p-10 text-center">
                  <Lock size={28} className="mx-auto text-blue-400" />

                  <h3 className="mt-4 text-sm font-semibold text-slate-300">
                    Login required
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                    Login to view and manage your personal prediction history.
                  </p>

                  <button
                    type="button"
                    onClick={openLogin}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                  >
                    <LogIn size={14} />
                    Login
                  </button>
                </div>
              )}

              {isAuthenticated && historyLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/2 p-10 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                  <p className="mt-4 text-xs text-slate-600">
                    Loading prediction history...
                  </p>
                </div>
              )}

              {isAuthenticated && !historyLoading && history.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <Clock3 size={28} className="mx-auto text-slate-700" />

                  <h3 className="mt-4 text-sm font-semibold text-slate-400">
                    No analyses yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                    Your prediction history will appear here after you analyze a
                    claim.
                  </p>
                </div>
              )}

              {isAuthenticated && !historyLoading && history.length > 0 && (
                <div className="space-y-3">
                  {history.map((item) => {
                    const itemIsFake = Number(item.prediction) === 0;

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/2.5 p-5 transition hover:border-blue-400/20"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {itemIsFake ? (
                                <AlertTriangle
                                  size={16}
                                  className="shrink-0 text-red-400"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                  className="shrink-0 text-emerald-400"
                                />
                              )}

                              <span
                                className={`text-sm font-semibold ${
                                  itemIsFake
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {itemIsFake
                                  ? "Potential Misinformation"
                                  : "Likely Authentic"}
                              </span>
                            </div>

                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                              {item.text}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-lg bg-blue-400/10 px-2.5 py-1 text-[10px] text-blue-400">
                                {item.model}
                              </span>

                              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] text-slate-500">
                                {item.dataset}
                              </span>

                              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] text-slate-500">
                                Accuracy: {item.model_accuracy}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                              <Clock3 size={12} />

                              {new Date(item.created_at).toLocaleString()}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                              <button
                                type="button"
                                onClick={() => useHistoryItem(item)}
                                className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                              >
                                Use this text again →
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteHistoryItem(item.id)}
                                className="flex items-center gap-1 text-xs text-slate-600 transition hover:text-red-400"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              Confidence
                            </p>

                            <p
                              className={`mt-1 text-lg font-bold ${
                                itemIsFake ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {(Number(item.confidence) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ==================================================
                PERFORMANCE
            ================================================== */}

            <section
              id="performance"
              className="mt-20 scroll-mt-24 border-t border-white/10 pt-20"
            >
              <div className="mx-auto max-w-6xl">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    Model Performance
                  </p>

                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                    Evaluation Results
                  </h2>

                  <p className="mt-4 leading-7 text-slate-500">
                    Performance of the machine learning models evaluated on
                    their respective datasets.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {Object.values(performanceData).map((model) => (
                    <div
                      key={model.name}
                      className="rounded-3xl border border-white/10 bg-white/2.5 p-6 shadow-xl backdrop-blur-xl sm:p-7"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Detection Model
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-white">
                            {model.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {model.dataset}
                          </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <BarChart3 size={20} />
                        </div>
                      </div>

                      <div className="mt-7 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Accuracy
                          </p>
                          <p className="mt-2 text-2xl font-bold text-blue-400">
                            {model.accuracy}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Precision
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.precision}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Recall
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.recall}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            F1 Score
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.f1}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Accuracy
                          </span>

                          <span className="text-xs font-semibold text-blue-400">
                            {model.accuracy}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-700"
                            style={{
                              width: model.accuracy,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-amber-400/10 bg-amber-400/3 p-4">
                  <p className="text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-amber-400">Note:</span>{" "}
                    Performance values are based on evaluation results obtained
                    during model testing. Results may vary depending on the
                    input data and preprocessing.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* ====================================================
            HOW IT WORKS
        ==================================================== */}

        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-white/10 px-4 py-24 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                How it works
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                From text to intelligent prediction
              </h2>

              <p className="mt-4 leading-7 text-slate-500">
                Our system combines natural language processing with machine
                learning to classify textual content.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="group rounded-2xl border border-white/10 bg-white/2.5 p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <FileText size={22} />
                </div>

                <p className="mb-2 text-xs font-semibold text-blue-400">
                  STEP 01
                </p>

                <h3 className="text-lg font-semibold">Text Processing</h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  The submitted content is cleaned and prepared using natural
                  language processing techniques.
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-white/2.5 p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Brain size={22} />
                </div>

                <p className="mb-2 text-xs font-semibold text-blue-400">
                  STEP 02
                </p>

                <h3 className="text-lg font-semibold">ML Classification</h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Text features are passed to a trained machine learning
                  classification model.
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-white/2.5 p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <BarChart3 size={22} />
                </div>

                <p className="mb-2 text-xs font-semibold text-blue-400">
                  STEP 03
                </p>

                <h3 className="text-lg font-semibold">Prediction</h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  The model returns a classification and confidence score for
                  the submitted content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            ABOUT
        ==================================================== */}

        <section id="about" className="scroll-mt-24 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="VeriSense"
                className="h-10 w-10 rounded-full object-contain"
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              About the project
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Misinformation Detection using NLP
            </h2>

            <p className="mt-5 leading-7 text-slate-500">
              This project explores how natural language processing and machine
              learning can be used to automatically classify potentially false
              or misleading textual content.
            </p>
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="VeriSense"
              className="h-6 w-6 rounded-full object-contain overflow-hidden"
            />

            <span>VeriSense</span>
          </div>

          <p>Misinformation Detection using NLP</p>
        </div>
      </footer>

      {/* ======================================================
          LOGIN / REGISTER MODAL
      ====================================================== */}

      {showAuth && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                    {authMode === "login" ? (
                      <LogIn size={20} />
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {authMode === "login" ? "Welcome back" : "Create account"}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {authMode === "login"
                        ? "Login to continue to VeriSense."
                        : "Create your VeriSense account."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAuth}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={authMode === "login" ? handleLogin : handleRegister}
              className="mt-7 space-y-5"
            >
              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {authMode === "register" && (
                  <p className="mt-2 text-[10px] text-slate-600">
                    Password must contain at least 8 characters.
                  </p>
                )}
              </div>

              {/* ERROR */}

              {authError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />

                  <span>{authError}</span>
                </div>
              )}

              {/* SUCCESS */}

              {authMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />

                  <span>{authMessage}</span>
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={authLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
              >
                {authMode === "login" ? (
                  <LogIn size={16} />
                ) : (
                  <UserPlus size={16} />
                )}

                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            {/* SWITCH */}

            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <p className="text-xs text-slate-600">
                {authMode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");

                    setAuthError("");
                    setAuthMessage("");
                  }}
                  className="ml-1 font-medium text-blue-400 transition hover:text-blue-300"
                >
                  {authMode === "login" ? "Create one" : "Login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
