import { useEffect, useState } from "react";
import {
  ShieldCheck,
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
  UserPlus,
  User,
  Menu,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  // ============================================================
  // AUTH
  // ============================================================

  const [token, setToken] = useState(
    () => localStorage.getItem("truthlens_token") || "",
  );

  const [user, setUser] = useState(null);

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // ============================================================
  // APP STATE
  // ============================================================

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [selectedModel, setSelectedModel] = useState("welfake");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("analyze");

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

  const performanceData = [
    {
      name: "WELFake — Hybrid SVM",
      dataset: "WELFake Dataset",
      accuracy: "98.65%",
      precision: "98.16%",
      recall: "98.85%",
      f1: "98.51%",
    },
    {
      name: "LIAR — SVM",
      dataset: "LIAR Dataset",
      accuracy: "61.17%",
      precision: "61.73%",
      recall: "81.79%",
      f1: "70.36%",
    },
  ];

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
  // AUTH HEADERS
  // ============================================================

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ============================================================
  // LOAD CURRENT USER
  // ============================================================

  const loadCurrentUser = async (savedToken = token) => {
    if (!savedToken) {
      setUser(null);
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid session");
      }

      const data = await response.json();

      setUser(data.user);

      return true;
    } catch (err) {
      console.error("Session verification error:", err);

      localStorage.removeItem("truthlens_token");
      setToken("");
      setUser(null);

      return false;
    }
  };

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const loadHistory = async (savedToken = token) => {
    if (!savedToken) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (response.status === 401) {
        handleLogout(false);
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
    const initializeApp = async () => {
      if (!token) return;

      const valid = await loadCurrentUser(token);

      if (valid) {
        await loadHistory(token);
      }
    };

    initializeApp();
  }, []);

  // ============================================================
  // ACTIVE NAVIGATION
  // ============================================================

  useEffect(() => {
    if (!user) return;

    const sections = [
      "analyze",
      "history",
      "performance",
      "how-it-works",
      "about",
    ];

    const observers = [];

    sections.forEach((id) => {
      const element = document.getElementById(id);

      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          rootMargin: "-25% 0px -65% 0px",
        },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [user]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigateTo = (id) => {
    setMobileMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!authEmail.trim()) {
      setAuthError("Please enter your email address.");
      return;
    }

    if (authPassword.length < 8) {
      setAuthError("Password must contain at least 8 characters.");
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    try {
      setAuthLoading(true);

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
        throw new Error(data.detail || "Registration failed.");
      }

      setAuthMessage("Account created successfully. You can now login.");

      setAuthMode("login");
      setAuthPassword("");
      setAuthConfirmPassword("");
    } catch (err) {
      console.error("Registration error:", err);
      setAuthError(err.message || "Unable to create account.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!authEmail.trim()) {
      setAuthError("Please enter your email address.");
      return;
    }

    if (!authPassword) {
      setAuthError("Please enter your password.");
      return;
    }

    try {
      setAuthLoading(true);

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
        throw new Error(data.detail || "Login failed.");
      }

      localStorage.setItem("truthlens_token", data.access_token);

      setToken(data.access_token);
      setUser(data.user);

      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthError("");
      setAuthMessage("");

      await loadHistory(data.access_token);
    } catch (err) {
      console.error("Login error:", err);

      setAuthError(err.message || "Unable to login.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = (showMessage = true) => {
    localStorage.removeItem("truthlens_token");

    setToken("");
    setUser(null);

    setHistory([]);
    setResult(null);
    setText("");
    setError("");

    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");

    setAuthMode("login");
    setMobileMenuOpen(false);

    if (showMessage) {
      setAuthMessage("You have been logged out.");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // ANALYZE
  // ============================================================

  const handleAnalyze = async () => {
    if (!token) {
      setError("Please login before analyzing text.");
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
          ...authHeaders(),
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      if (response.status === 401) {
        handleLogout(false);
        setError("Your session has expired. Please login again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction request failed.");
      }

      if (data.prediction === -1) {
        setError("Please enter some valid text before analyzing.");
        return;
      }

      setResult(data);

      await loadHistory(token);
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
  // EXAMPLE
  // ============================================================

  const handleExample = (example) => {
    setText(example);
    setResult(null);
    setError("");

    navigateTo("analyze");
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
  // CLEAR HISTORY MODAL
  // ============================================================

  const openClearHistoryModal = () => {
    if (history.length === 0) return;

    setShowClearModal(true);
  };

  const confirmClearHistory = async () => {
    try {
      setClearLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });

      if (response.status === 401) {
        setShowClearModal(false);
        handleLogout(false);
        setError("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Failed to clear history.");
      }

      setHistory([]);
      setResult(null);
      setShowClearModal(false);
    } catch (err) {
      console.error("Clear history error:", err);

      setError("Unable to clear prediction history from the server.");
    } finally {
      setClearLoading(false);
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

    navigateTo("analyze");
  };

  // ============================================================
  // DELETE HISTORY ITEM
  // ============================================================

  const deleteHistoryItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });

      if (response.status === 401) {
        handleLogout(false);
        setError("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete history item.");
      }

      setHistory((previous) => previous.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete history error:", err);

      setError("Unable to delete this prediction from the server.");
    }
  };

  // ============================================================
  // RESULT
  // ============================================================

  const isFake = result?.prediction === 0;

  const confidence = result?.confidence ? Number(result.confidence) * 100 : 0;

  // ============================================================
  // AUTH SCREEN
  // ============================================================

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="border-b border-white/10 bg-slate-950/95">
          <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <ShieldCheck size={22} />
              </div>

              <div>
                <span className="block text-lg font-bold">TruthLens</span>

                <span className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
                  NLP Intelligence
                </span>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                {authMode === "login" ? (
                  <LogIn size={25} />
                ) : (
                  <UserPlus size={25} />
                )}
              </div>

              <h1 className="mt-6 text-3xl font-bold">
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {authMode === "login"
                  ? "Login to continue using TruthLens."
                  : "Create an account to save your prediction history."}
              </p>
            </div>

            <form
              onSubmit={authMode === "login" ? handleLogin : handleRegister}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl sm:p-8"
            >
              {authMessage && (
                <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-400">
                  {authMessage}
                </div>
              )}

              {authError && (
                <div className="mb-5 flex gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Email
              </label>

              <div className="relative">
                <User
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-11 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <label className="mb-2 mt-5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Password
              </label>

              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
              />

              {authMode === "register" && (
                <>
                  <label className="mb-2 mt-5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  />
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
              >
                {authMode === "login" ? (
                  <LogIn size={17} />
                ) : (
                  <UserPlus size={17} />
                )}

                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>

              <div className="mt-6 text-center text-sm text-slate-500">
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
                  className="ml-2 font-medium text-blue-400 hover:text-blue-300"
                >
                  {authMode === "login" ? "Register" : "Login"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <ShieldCheck size={22} />
            </div>

            <div className="text-left">
              <span className="block text-lg font-bold tracking-tight">
                TruthLens
              </span>

              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
                NLP Intelligence
              </span>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <div className="hidden items-center gap-1 lg:flex">
            {[
              ["analyze", "Analyze"],
              ["history", "History"],
              ["performance", "Performance"],
              ["how-it-works", "How It Works"],
              ["about", "About"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  activeSection === id
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/5 px-3 py-1.5 text-xs text-blue-300 xl:flex">
              <User size={12} />
              {user.email}
            </div>

            <button
              type="button"
              onClick={() => handleLogout(true)}
              className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-red-400/20 hover:text-red-400 sm:flex"
            >
              <LogOut size={14} />
              Logout
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-400 xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              System Ready
            </div>

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((previous) => !previous)}
              className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-950/98 px-4 py-4 lg:hidden">
            <div className="mx-auto max-w-7xl space-y-1">
              {[
                ["analyze", "Analyze"],
                ["history", "History"],
                ["performance", "Performance"],
                ["how-it-works", "How It Works"],
                ["about", "About"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigateTo(id)}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm ${
                    activeSection === id
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="my-3 h-px bg-white/10" />

              <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
                <User size={13} />
                {user.email}
              </div>

              <button
                type="button"
                onClick={() => handleLogout(true)}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-400 hover:bg-red-400/5"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 -top-24 h-125 w-175 max-w-[90vw] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24 lg:pt-28">
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

            <button
              type="button"
              onClick={() => navigateTo("analyze")}
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-600/30"
            >
              <Search size={17} />
              Start Analyzing
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            {/* QUICK STATS */}

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                <p className="text-2xl font-bold text-blue-400">98.65%</p>
                <p className="mt-1 text-xs text-slate-500">WELFake Accuracy</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                <p className="text-2xl font-bold text-cyan-400">61.17%</p>
                <p className="mt-1 text-xs text-slate-500">LIAR Accuracy</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                <p className="text-2xl font-bold text-emerald-400">2</p>
                <p className="mt-1 text-xs text-slate-500">
                  ML Detection Models
                </p>
              </div>
            </div>
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
                    placeholder="Paste a news claim or textual content here..."
                    className="min-h-52 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-5 pr-12 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {text.length > 0 && (
                    <button
                      type="button"
                      onClick={clearText}
                      className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
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

                  {loading ? "Analyzing..." : "Analyze Text"}

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

            {/* ERROR */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* RESULT */}

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

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={openClearHistoryModal}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500 transition hover:border-red-400/20 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                    Clear History
                  </button>
                )}
              </div>

              {historyLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/2 p-10 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />
                  <p className="mt-4 text-xs text-slate-600">
                    Loading prediction history...
                  </p>
                </div>
              )}

              {!historyLoading && history.length === 0 && (
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

              {!historyLoading && history.length > 0 && (
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
                                className="text-xs font-medium text-blue-400 hover:text-blue-300"
                              >
                                Use this text again →
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteHistoryItem(item.id)}
                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400"
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
                  {performanceData.map((model) => (
                    <div
                      key={model.name}
                      className="rounded-3xl border border-white/10 bg-white/2.5 p-6 shadow-xl backdrop-blur-xl sm:p-7"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Detection Model
                          </p>

                          <h3 className="mt-2 text-xl font-bold">
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
                        {[
                          ["Accuracy", model.accuracy],
                          ["Precision", model.precision],
                          ["Recall", model.recall],
                          ["F1 Score", model.f1],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-white/5 bg-slate-950/60 p-4"
                          >
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              {label}
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-300">
                              {value}
                            </p>
                          </div>
                        ))}
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
                            className="h-full rounded-full bg-blue-500"
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
              {[
                {
                  icon: FileText,
                  step: "STEP 01",
                  title: "Text Processing",
                  description:
                    "The submitted content is cleaned and prepared using natural language processing techniques.",
                },
                {
                  icon: Brain,
                  step: "STEP 02",
                  title: "ML Classification",
                  description:
                    "Text features are passed to a trained machine learning classification model.",
                },
                {
                  icon: BarChart3,
                  step: "STEP 03",
                  title: "Prediction",
                  description:
                    "The model returns a classification and confidence score for the submitted content.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-white/10 bg-white/2.5 p-7 transition hover:-translate-y-1 hover:border-blue-400/20"
                  >
                    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Icon size={22} />
                    </div>

                    <p className="mb-2 text-xs font-semibold text-blue-400">
                      {item.step}
                    </p>

                    <h3 className="text-lg font-semibold">{item.title}</h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================
            ABOUT
        ==================================================== */}

        <section id="about" className="scroll-mt-24 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={23} />
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

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-300">TruthLens</p>

              <p className="text-xs text-slate-600">NLP Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <button
              onClick={() => navigateTo("analyze")}
              className="hover:text-blue-400"
            >
              Analyze
            </button>

            <button
              onClick={() => navigateTo("history")}
              className="hover:text-blue-400"
            >
              History
            </button>

            <button
              onClick={() => navigateTo("performance")}
              className="hover:text-blue-400"
            >
              Performance
            </button>

            <button
              onClick={() => navigateTo("about")}
              className="hover:text-blue-400"
            >
              About
            </button>
          </div>

          <p className="text-xs text-slate-600">© 2026 TruthLens</p>
        </div>

        <div className="mx-auto mt-6 max-w-6xl border-t border-white/5 pt-6 text-center text-xs text-slate-700">
          Misinformation Detection using NLP
        </div>
      </footer>

      {/* ======================================================
          CUSTOM CLEAR HISTORY MODAL
      ====================================================== */}

      {showClearModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
                  <Trash2 size={20} />
                </div>

                <div>
                  <h2
                    id="clear-history-title"
                    className="text-lg font-bold text-white"
                  >
                    Delete Prediction History
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Permanent action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearLoading}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-red-400/10 bg-red-400/4 p-4">
              <p className="text-sm leading-6 text-slate-400">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-slate-200">
                  all prediction history
                </span>
                ?
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                This action cannot be undone. All saved predictions for your
                account will be removed from PostgreSQL.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearLoading}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmClearHistory}
                disabled={clearLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />

                {clearLoading ? "Deleting..." : "Delete History"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
