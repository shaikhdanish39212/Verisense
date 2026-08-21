import { useCallback, useEffect, useMemo, useState } from "react";
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
  Menu,
  ShieldCheck,
  RotateCcw,
  Filter,
  History as HistoryIcon,
  Info,
} from "lucide-react";

const DEFAULT_API_BASE_URL = "https://verisense-backend-2794.onrender.com";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

const TOKEN_KEY = "verisense_access_token";
const USER_KEY = "verisense_user";

const getErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.clone().json();

    if (data?.detail) {
      return data.detail;
    }

    if (data?.message) {
      return data.message;
    }
  } catch {
    // Ignore JSON parse issues and fall back to a generic message.
  }

  return fallbackMessage;
};

function App() {
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );

  const [apiStatus, setApiStatus] = useState("checking");

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
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedModel, setSelectedModel] = useState("welfake");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ============================================================
  // HISTORY UX STATE
  // ============================================================

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyModelFilter, setHistoryModelFilter] = useState("all");

  // ============================================================
  // MOBILE NAVIGATION
  // ============================================================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ============================================================
  // DELETE CONFIRMATION MODAL
  // ============================================================

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken("");
    setUser(null);

    setHistory([]);
    setResult(null);
    setText("");

    setShowAllHistory(false);
    setHistorySearch("");
    setHistoryFilter("all");
    setHistoryModelFilter("all");

    setMobileMenuOpen(false);

    setError("You have been logged out.");
  }, []);

  // ============================================================
  // VERIFY BACKEND HEALTH
  // ============================================================

  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Backend health check failed");
      }

      setApiStatus("healthy");
      return true;
    } catch (error) {
      console.error("API health check failed:", error);
      setApiStatus("unhealthy");
      return false;
    }
  }, []);

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
  // LOAD HISTORY
  // ============================================================

  const loadHistory = useCallback(
    async (providedToken = null) => {
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
    },
    [handleLogout, token],
  );

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

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Invalid email or password."),
        );
      }

      const data = await response.json();

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

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Unable to create account."),
        );
      }

      const data = await response.json();

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
    setMobileMenuOpen(false);
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
  // INITIAL SESSION
  // ============================================================

  useEffect(() => {
    verifySession();
    checkApiHealth();
  }, [checkApiHealth]);

  // ============================================================
  // LOAD HISTORY AFTER AUTHENTICATION
  // ============================================================

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, loadHistory]);

  // ============================================================
  // HISTORY FILTERING
  // ============================================================

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    return history.filter((item) => {
      const prediction = Number(item.prediction);

      const matchesSearch =
        !search ||
        item.text?.toLowerCase().includes(search) ||
        item.model?.toLowerCase().includes(search) ||
        item.dataset?.toLowerCase().includes(search);

      const matchesStatus =
        historyFilter === "all" ||
        (historyFilter === "fake" && prediction === 0) ||
        (historyFilter === "authentic" && prediction !== 0);

      const matchesModel =
        historyModelFilter === "all" ||
        (historyModelFilter === "liar" && item.dataset === "LIAR Dataset") ||
        (historyModelFilter === "welfake" && item.dataset !== "LIAR Dataset");

      return matchesSearch && matchesStatus && matchesModel;
    });
  }, [history, historySearch, historyFilter, historyModelFilter]);

  const visibleHistory = showAllHistory
    ? filteredHistory
    : filteredHistory.slice(0, 5);

  // ============================================================
  // ANALYZE TEXT
  // ============================================================

  const handleAnalyze = async () => {
    if (apiStatus !== "healthy") {
      setError(
        "The prediction service is currently unavailable. Please try again in a moment.",
      );
      return;
    }

    if (!isAuthenticated) {
      setError("Login is required to analyze and save prediction history.");

      openLogin();
      return;
    }

    if (!text.trim()) {
      setError("Please enter some text before analyzing.");
      return;
    }

    if (text.trim().length < 5) {
      setError("Please enter a little more text for meaningful analysis.");
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
          text: text.trim(),
        }),
      });

      if (response.status === 401) {
        handleLogout();

        setError("Your session has expired. Please login again.");

        return;
      }

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Prediction request failed."),
        );
      }

      const data = await response.json();

      if (data.prediction === -1) {
        setError("Please enter some valid text before analyzing.");
        return;
      }

      setResult(data);
      setLastUpdated(new Date().toLocaleString());

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
  // ANALYZE ANOTHER TEXT
  // ============================================================

  const analyzeAnotherText = () => {
    setText("");
    setResult(null);
    setError("");

    document.getElementById("analyze")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ============================================================
  // CLEAR HISTORY
  // ============================================================

  const clearHistory = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (history.length === 0) {
      return;
    }

    setDeleteModal({
      open: true,
      type: "all",
      id: null,
    });
  };

  // ============================================================
  // DELETE SINGLE HISTORY ITEM
  // ============================================================

  const requestDeleteHistoryItem = (id) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    setDeleteModal({
      open: true,
      type: "single",
      id,
    });
  };

  // ============================================================
  // CLOSE DELETE MODAL
  // ============================================================

  const closeDeleteModal = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteModal({
      open: false,
      type: null,
      id: null,
    });
  };

  // ============================================================
  // CONFIRM DELETE
  // ============================================================

  const confirmDeleteAction = async () => {
    if (!deleteModal.open) {
      return;
    }

    setDeleteLoading(true);
    setError("");

    try {
      if (deleteModal.type === "all") {
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
        setShowAllHistory(false);
        setHistorySearch("");
        setHistoryFilter("all");
        setHistoryModelFilter("all");

        setDeleteModal({
          open: false,
          type: null,
          id: null,
        });

        return;
      }

      if (deleteModal.type === "single") {
        const response = await fetch(
          `${API_BASE_URL}/history/${deleteModal.id}`,
          {
            method: "DELETE",
            headers: {
              ...getAuthHeaders(),
            },
          },
        );

        if (response.status === 401) {
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to delete history item");
        }

        setHistory((previousHistory) =>
          previousHistory.filter((item) => item.id !== deleteModal.id),
        );

        setDeleteModal({
          open: false,
          type: null,
          id: null,
        });
      }
    } catch (err) {
      console.error("Delete history error:", err);

      setError(
        deleteModal.type === "all"
          ? "Unable to clear prediction history from the server."
          : "Unable to delete this prediction from the server.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================
  // APPLY HISTORY ITEM
  // ============================================================

  const applyHistoryItem = (item) => {
    setText(item.text || "");

    setSelectedModel(item.dataset === "LIAR Dataset" ? "liar" : "welfake");

    setResult(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // RESET HISTORY FILTERS
  // ============================================================

  const resetHistoryFilters = () => {
    setHistorySearch("");
    setHistoryFilter("all");
    setHistoryModelFilter("all");
  };

  // ============================================================
  // PREDICTION STATUS
  // ============================================================

  const isFake = result?.prediction === 0;

  // ============================================================
  // CONFIDENCE
  // ============================================================

  const confidence = result?.confidence ? Number(result.confidence) * 100 : 0;

  const safeConfidence = Math.min(Math.max(confidence, 0), 100);

  // ============================================================
  // RESULT LABEL
  // ============================================================

  const resultTitle = isFake ? "Potential Misinformation" : "Likely Authentic";

  const resultDescription = isFake
    ? "The model identified patterns that are more commonly associated with potentially misleading content."
    : "The model identified patterns that are more consistent with authentic content.";

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-18 items-center justify-between">
            {/* LOGO */}

            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-w-0 items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="VeriSense"
                className="h-10 w-10 shrink-0 rounded-full object-contain"
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

            {/* DESKTOP NAV */}

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

            {/* RIGHT SIDE */}

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 xl:flex">
                  <User size={13} className="text-blue-400" />

                  <span className="max-w-35 truncate">{user?.email}</span>
                </div>
              )}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-red-400/30 hover:text-red-400"
                >
                  <LogOut size={14} />

                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLogin}
                  className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-400/15 hover:text-blue-200"
                >
                  <LogIn size={14} />
                  Login
                </button>
              )}

              <div
                className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs sm:flex ${
                  apiStatus === "healthy"
                    ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-400"
                    : apiStatus === "unhealthy"
                      ? "border-red-400/15 bg-red-400/5 text-red-400"
                      : "border-amber-400/15 bg-amber-400/5 text-amber-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    apiStatus === "healthy"
                      ? "bg-emerald-400"
                      : apiStatus === "unhealthy"
                        ? "bg-red-400"
                        : "bg-amber-300"
                  }`}
                />
                {apiStatus === "healthy"
                  ? "System Ready"
                  : apiStatus === "unhealthy"
                    ? "Backend Offline"
                    : "Checking Service"}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((previous) => !previous)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-blue-400/20 hover:text-white lg:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>

          {/* MOBILE NAVIGATION */}

          {mobileMenuOpen && (
            <div className="border-t border-white/10 py-4 lg:hidden">
              <div className="space-y-1">
                {[
                  ["Analyze", "#analyze"],
                  ["History", "#history"],
                  ["Performance", "#performance"],
                  ["How It Works", "#how-it-works"],
                  ["About", "#about"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{label}</span>
                    <ChevronRight size={15} />
                  </a>
                ))}
              </div>

              {isAuthenticated && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <User size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Signed in as
                    </p>

                    <p className="truncate text-xs text-slate-300">
                      {user?.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                System Ready
                <span className="ml-auto text-[10px] text-emerald-400/50">
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ======================================================
          MAIN
      ====================================================== */}

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

            {!isAuthenticated && (
              <div className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-500">
                <Lock size={13} />
                Login required to run and save analyses
              </div>
            )}

            {apiStatus !== "healthy" && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-300">
                <Clock3 size={13} />
                {apiStatus === "unhealthy"
                  ? "Backend is temporarily unavailable. Please try again later."
                  : "Checking the prediction service..."}
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            ANALYZER
        ==================================================== */}

        <section id="analyze" className="scroll-mt-24 px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur-xl">
              {/* ANALYZER HEADER */}

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

              {/* ANALYZER BODY */}

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

                {/* EXAMPLES */}

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

                <div className="min-w-0 flex-1">
                  <p>{error}</p>

                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={openLogin}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/15"
                    >
                      <LogIn size={13} />
                      Login to Continue
                    </button>
                  )}
                </div>
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
                        {resultTitle}
                      </h3>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        {resultDescription}
                      </p>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-center sm:min-w-37.5 sm:w-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Confidence
                    </p>

                    <p
                      className={`mt-1 text-2xl font-bold ${
                        isFake ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {safeConfidence.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* MODEL */}

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

                {/* CONFIDENCE */}

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
                      {safeConfidence.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFake ? "bg-red-400" : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${safeConfidence}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/2.5 p-3">
                    <Info
                      size={14}
                      className="mt-0.5 shrink-0 text-slate-600"
                    />

                    <p className="text-[11px] leading-5 text-slate-600">
                      Confidence indicates how strongly the model favors its
                      predicted class. It is not a measure of factual truth.
                    </p>
                  </div>

                  {lastUpdated && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-3 py-2 text-[10px] text-slate-500">
                      <span>Last analyzed</span>
                      <span>{lastUpdated}</span>
                    </div>
                  )}
                </div>

                <div className="my-6 h-px bg-white/10" />

                {/* MODEL DETAILS */}

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

                {/* IMPORTANT NOTE */}

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

                {/* ANALYZE ANOTHER */}

                <button
                  type="button"
                  onClick={analyzeAnotherText}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-5 py-3 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/15 hover:text-blue-200"
                >
                  <RotateCcw size={14} />
                  Analyze Another Text
                </button>
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

                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold">
                    Recent Analyses
                    {isAuthenticated && history.length > 0 && (
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-600">
                        {history.length}
                      </span>
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your previous predictions are securely stored with your
                    account.
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

              {/* LOGIN REQUIRED */}

              {!isAuthenticated && (
                <div className="rounded-2xl border border-dashed border-blue-400/20 bg-blue-400/5 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <Lock size={22} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-300">
                    Your history is private
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                    Login to view your previous analyses, search your history,
                    reuse predictions, and manage saved results.
                  </p>

                  <button
                    type="button"
                    onClick={openLogin}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                  >
                    <LogIn size={14} />
                    Login to View History
                  </button>
                </div>
              )}

              {/* LOADING */}

              {isAuthenticated && historyLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/2 p-10 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                  <p className="mt-4 text-xs text-slate-600">
                    Loading prediction history...
                  </p>
                </div>
              )}

              {/* EMPTY */}

              {isAuthenticated && !historyLoading && history.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-700">
                    <HistoryIcon size={22} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-400">
                    No analyses yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                    Analyze your first claim and your prediction will appear
                    here.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("analyze")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-slate-400 transition hover:border-blue-400/20 hover:text-blue-400"
                  >
                    <Search size={13} />
                    Start Analyzing
                  </button>
                </div>
              )}

              {/* HISTORY SEARCH + FILTERS */}

              {isAuthenticated && !historyLoading && history.length > 0 && (
                <div className="mb-5 space-y-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      value={historySearch}
                      onChange={(e) => {
                        setHistorySearch(e.target.value);
                        setShowAllHistory(true);
                      }}
                      placeholder="Search your analyses..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-600">
                      <Filter size={12} />
                      Filter
                    </div>

                    {[
                      ["all", "All"],
                      ["fake", "Misinformation"],
                      ["authentic", "Authentic"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setHistoryFilter(value)}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          historyFilter === value
                            ? "border-blue-400/20 bg-blue-500/15 text-blue-400"
                            : "border-white/10 text-slate-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}

                    <select
                      value={historyModelFilter}
                      onChange={(e) => setHistoryModelFilter(e.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none"
                    >
                      <option value="all">All Models</option>

                      <option value="welfake">WELFake</option>

                      <option value="liar">LIAR</option>
                    </select>

                    {(historySearch ||
                      historyFilter !== "all" ||
                      historyModelFilter !== "all") && (
                      <button
                        type="button"
                        onClick={resetHistoryFilters}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] text-slate-600 transition hover:text-white"
                      >
                        <X size={12} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* NO FILTER RESULTS */}

              {isAuthenticated &&
                !historyLoading &&
                history.length > 0 &&
                filteredHistory.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
                    <Search size={24} className="mx-auto text-slate-700" />

                    <h3 className="mt-3 text-sm font-semibold text-slate-400">
                      No matching analyses
                    </h3>

                    <p className="mt-2 text-xs text-slate-600">
                      Try changing your search or filters.
                    </p>

                    <button
                      type="button"
                      onClick={resetHistoryFilters}
                      className="mt-4 text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                      Reset filters
                    </button>
                  </div>
                )}

              {/* HISTORY ITEMS */}

              {isAuthenticated &&
                !historyLoading &&
                filteredHistory.length > 0 && (
                  <>
                    <div className="space-y-3">
                      {visibleHistory.map((item) => {
                        const itemIsFake = Number(item.prediction) === 0;

                        const itemConfidence = Math.min(
                          Math.max(Number(item.confidence) * 100, 0),
                          100,
                        );

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
                                    onClick={() => applyHistoryItem(item)}
                                    className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                                  >
                                    Use this text again →
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestDeleteHistoryItem(item.id)
                                    }
                                    className="flex items-center gap-1 text-xs text-slate-600 transition hover:text-red-400"
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {/* CONFIDENCE */}

                              <div className="w-full shrink-0 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center sm:w-auto">
                                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                  Confidence
                                </p>

                                <p
                                  className={`mt-1 text-lg font-bold ${
                                    itemIsFake
                                      ? "text-red-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {itemConfidence.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* VIEW ALL */}

                    {filteredHistory.length > 5 && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllHistory((previous) => !previous)
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-medium text-slate-400 transition hover:border-blue-400/20 hover:text-blue-400"
                      >
                        {showAllHistory
                          ? "Show Less"
                          : `View All History (${filteredHistory.length})`}

                        <ChevronRight
                          size={14}
                          className={`transition-transform ${
                            showAllHistory ? "-rotate-90" : "rotate-90"
                          }`}
                        />
                      </button>
                    )}
                  </>
                )}
            </section>
            {/* ==================================================
                PERFORMANCE
            ================================================== */}

            <section id="performance" className="mt-24 scroll-mt-24">
              <div className="mb-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Model Performance
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Built on measured performance
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  VeriSense uses trained machine-learning models evaluated on
                  established datasets.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {Object.entries(performanceData).map(([key, model]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-blue-400/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 size={17} className="text-blue-400" />

                          <h3 className="text-sm font-semibold text-slate-200">
                            {model.name}
                          </h3>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                          {model.dataset}
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400">
                        {model.accuracy}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/3 p-3 text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Precision
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {model.precision}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/3 p-3 text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Recall
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {model.recall}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/3 p-3 text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          F1 Score
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {model.f1}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/2 p-5">
                <Info size={16} className="mt-0.5 shrink-0 text-slate-600" />

                <p className="text-xs leading-5 text-slate-600">
                  Performance values represent evaluation results of the
                  respective models on their corresponding datasets. Results on
                  real-world unseen content may differ.
                </p>
              </div>
            </section>

            {/* ==================================================
                HOW IT WORKS
            ================================================== */}

            <section id="how-it-works" className="mt-28 scroll-mt-24">
              <div className="mb-10 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  How It Works
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  From text to prediction
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  A simple NLP pipeline converts textual input into a
                  machine-learning prediction.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  {
                    number: "01",
                    icon: FileText,
                    title: "Input",
                    description: "Enter a headline, claim, or news article.",
                  },
                  {
                    number: "02",
                    icon: Brain,
                    title: "NLP Processing",
                    description:
                      "The text is transformed into machine-readable features.",
                  },
                  {
                    number: "03",
                    icon: BarChart3,
                    title: "Classification",
                    description: "The selected SVM model evaluates the text.",
                  },
                  {
                    number: "04",
                    icon: CheckCircle2,
                    title: "Result",
                    description:
                      "The system returns a prediction and confidence score.",
                  },
                ].map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.number}
                      className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-400">
                          <Icon size={18} />
                        </div>

                        <span className="text-xs font-semibold text-slate-700">
                          {step.number}
                        </span>
                      </div>

                      <h3 className="mt-6 text-sm font-semibold text-slate-200">
                        {step.title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ==================================================
                ABOUT
            ================================================== */}

            <section id="about" className="mt-28 scroll-mt-24 pb-24">
              <div className="rounded-3xl border border-white/10 bg-linear-to-br from-blue-500/5 via-transparent to-cyan-400/5 p-6 sm:p-10">
                <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-blue-400" />

                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                        About VeriSense
                      </p>
                    </div>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight">
                      A machine-learning approach to misinformation detection.
                    </h2>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500">
                      VeriSense is an NLP-based system designed to classify
                      textual content using machine learning. It provides users
                      with a prediction, confidence score, and model information
                      to support faster evaluation of potentially misleading
                      content.
                    </p>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                      The system is intended as a decision-support and
                      educational tool rather than a replacement for independent
                      fact-checking.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                      <Brain size={18} className="text-blue-400" />

                      <p className="mt-4 text-2xl font-bold">NLP</p>

                      <p className="mt-1 text-xs text-slate-600">
                        Natural Language Processing
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                      <BarChart3 size={18} className="text-emerald-400" />

                      <p className="mt-4 text-2xl font-bold">SVM</p>

                      <p className="mt-1 text-xs text-slate-600">
                        Machine Learning Classifier
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                      <ShieldCheck size={18} className="text-cyan-400" />

                      <p className="mt-4 text-2xl font-bold">Secure</p>

                      <p className="mt-1 text-xs text-slate-600">
                        Account-based history
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                      <HistoryIcon size={18} className="text-violet-400" />

                      <p className="mt-4 text-2xl font-bold">History</p>

                      <p className="mt-1 text-xs text-slate-600">
                        Saved predictions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="VeriSense"
                className="h-9 w-9 rounded-full object-contain"
              />

              <div>
                <p className="text-sm font-bold">
                  <span className="text-white">Veri</span>
                  <span className="text-blue-400">Sense</span>
                </p>

                <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-700">
                  NLP Misinformation Detection
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <a href="#analyze" className="transition hover:text-white">
                Analyze
              </a>

              <a href="#history" className="transition hover:text-white">
                History
              </a>

              <a href="#performance" className="transition hover:text-white">
                Performance
              </a>

              <a href="#about" className="transition hover:text-white">
                About
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/5 pt-6 text-[10px] leading-5 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} VeriSense. All rights reserved.</p>

            <p>AI predictions should be independently verified.</p>
          </div>
        </div>
      </footer>

      {/* ======================================================
          AUTH MODAL
      ====================================================== */}

      {showAuth && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            {/* CLOSE */}

            <button
              type="button"
              onClick={closeAuth}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Close authentication modal"
            >
              <X size={17} />
            </button>

            {/* HEADER */}

            <div className="border-b border-white/10 px-6 pb-6 pt-7 sm:px-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                {authMode === "login" ? (
                  <LogIn size={21} />
                ) : (
                  <UserPlus size={21} />
                )}
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {authMode === "login"
                  ? "Login to analyze content and access your prediction history."
                  : "Create an account to securely save and manage your analyses."}
              </p>
            </div>

            {/* FORM */}

            <form
              onSubmit={authMode === "login" ? handleLogin : handleRegister}
              className="p-6 sm:p-8"
            >
              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {authMode === "register" && (
                  <p className="mt-2 text-[10px] text-slate-700">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {/* ERROR */}

              {authError && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />

                  <span>{authError}</span>
                </div>
              )}

              {/* SUCCESS */}

              {authMessage && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />

                  <span>{authMessage}</span>
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
              >
                {authLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Please wait...
                  </>
                ) : authMode === "login" ? (
                  <>
                    <LogIn size={16} />
                    Login
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Account
                  </>
                )}
              </button>

              {/* SWITCH */}

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-700">
                  {authMode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");

                    setAuthError("");
                    setAuthMessage("");
                    setAuthPassword("");
                  }}
                  className="mt-1 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  {authMode === "login" ? "Create an account" : "Login instead"}
                </button>
              </div>

              {/* PRIVACY */}

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/5 bg-white/2 p-3">
                <ShieldCheck
                  size={13}
                  className="mt-0.5 shrink-0 text-slate-600"
                />

                <p className="text-[10px] leading-4 text-slate-700">
                  Your prediction history is associated with your account and is
                  only accessible after authentication.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteModal.open && (
        <div
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
              <Trash2 size={21} />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {deleteModal.type === "all"
                ? "Clear all history?"
                : "Delete this analysis?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {deleteModal.type === "all"
                ? "This will permanently remove all saved predictions from your account."
                : "This prediction will be permanently removed from your history."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
