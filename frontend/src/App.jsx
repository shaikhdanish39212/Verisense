import { useState, useEffect } from "react";
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
} from "lucide-react";

function App() {
  // ==========================================
  // STATE
  // ==========================================

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [selectedModel, setSelectedModel] = useState("welfake");

  // ==========================================
  // PREDICTION HISTORY
  // ==========================================

  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem("truthlens_history");

      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch {
      return [];
    }
  });

  // ==========================================
  // SAVE HISTORY
  // ==========================================

  useEffect(() => {
    localStorage.setItem("truthlens_history", JSON.stringify(history));
  }, [history]);

  // ==========================================
  // MODEL INFORMATION
  // ==========================================

  const modelInfo = {
    welfake: {
      name: "Hybrid SVM",
      dataset: "WELFake Dataset",
      accuracy: "98.65%",
      endpoint: "http://127.0.0.1:8000/predict",
      description:
        "Designed for news article and general textual content classification.",
    },

    liar: {
      name: "LIAR SVM",
      dataset: "LIAR Dataset",
      accuracy: "61.17%",
      endpoint: "http://127.0.0.1:8000/predict-liar",
      description: "Designed primarily for political claim classification.",
    },
  };

  const currentModel = modelInfo[selectedModel];

  // ==========================================
  // MODEL PERFORMANCE DATA
  // ==========================================

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

  // ==========================================
  // EXAMPLE TEXTS
  // ==========================================

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

  // ==========================================
  // SEND TEXT TO FASTAPI
  // ==========================================

  const handleAnalyze = async () => {
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
        },
        body: JSON.stringify({
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      // ==========================================
      // INVALID RESPONSE
      // ==========================================

      if (data.prediction === -1) {
        setError("Please enter some text before analyzing.");
        return;
      }

      // ==========================================
      // SET RESULT
      // ==========================================

      setResult(data);

      // ==========================================
      // CREATE HISTORY ITEM
      // ==========================================

      const historyItem = {
        id: Date.now(),
        text: text,
        prediction: Number(data.prediction),
        confidence: Number(data.confidence) * 100,
        model: currentModel.name,
        dataset: currentModel.dataset,
        accuracy: currentModel.accuracy,
        time: new Date().toLocaleString(),
      };

      // ==========================================
      // SAVE HISTORY
      // ==========================================

      setHistory((previousHistory) =>
        [historyItem, ...previousHistory].slice(0, 10),
      );
    } catch (err) {
      setError(
        "Unable to connect to the prediction server. Make sure FastAPI is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MODEL CHANGE
  // ==========================================

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    setResult(null);
    setError("");
  };

  // ==========================================
  // USE EXAMPLE
  // ==========================================

  const handleExample = (example) => {
    setText(example);
    setResult(null);
    setError("");
  };

  // ==========================================
  // CLEAR TEXT
  // ==========================================

  const clearText = () => {
    setText("");
    setResult(null);
    setError("");
  };

  // ==========================================
  // CLEAR HISTORY
  // ==========================================

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("truthlens_history");
  };

  // ==========================================
  // USE HISTORY ITEM
  // ==========================================

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

  // ==========================================
  // PREDICTION STATUS
  // ==========================================

  const isFake = result?.prediction === 0;

  // ==========================================
  // CONFIDENCE
  // ==========================================

  const confidence = result?.confidence ? Number(result.confidence) * 100 : 0;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ========================================
          NAVBAR
      ======================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}

          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>

            <div>
              <span className="block text-lg font-bold tracking-tight">
                TruthLens
              </span>

              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
                NLP Intelligence
              </span>
            </div>
          </a>

          {/* Navigation */}

          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
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

          {/* System Status */}

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            System Ready
          </div>
        </div>
      </nav>

      {/* ========================================
          MAIN
      ======================================== */}

      <main>
        {/* ======================================
            HERO
        ====================================== */}

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-[-150px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:pt-28">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-medium text-blue-300">
              <Sparkles size={14} />
              NLP-Powered Misinformation Detection
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Detect misinformation
              <span className="mt-2 block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                before it spreads.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Analyze news claims and textual content using natural language
              processing and machine learning.
            </p>
          </div>
        </section>

        {/* ======================================
            ANALYZER
        ====================================== */}

        <section id="analyze" className="scroll-mt-24 px-6 pb-24">
          <div className="mx-auto max-w-4xl">
            {/* Analyzer Card */}

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur-xl">
              {/* Analyzer Header */}

              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
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

                {/* Model Selector */}

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Select Detection Model
                  </label>

                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className="w-full max-w-sm rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="welfake">
                      WELFake — News Article Detection
                    </option>

                    <option value="liar">
                      LIAR — Political Claim Detection
                    </option>
                  </select>

                  {/* Dataset Information */}

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

              {/* Text Input */}

              <div className="p-6 sm:p-8">
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
                      aria-label="Clear text"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Character Counter */}

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {text.length === 0
                      ? "Maximum 2,000 characters"
                      : `${text.length} / 2,000 characters`}
                  </span>

                  <span className="text-slate-600">Text classification</span>
                </div>

                {/* Analyze Button */}

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

                {/* Examples */}

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
                        className="group flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left text-xs leading-5 text-slate-500 transition hover:border-blue-400/20 hover:bg-blue-400/[0.03] hover:text-slate-300"
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

            {/* ==================================
                ERROR MESSAGE
            ================================== */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />

                <p>{error}</p>
              </div>
            )}

            {/* ==================================
                PREDICTION RESULT
            ================================== */}

            {result && (
              <div
                className={`mt-5 rounded-3xl border p-6 shadow-xl backdrop-blur-xl sm:p-8 ${
                  isFake
                    ? "border-red-400/20 bg-red-400/[0.04]"
                    : "border-emerald-400/20 bg-emerald-400/[0.04]"
                }`}
              >
                {/* Result Header */}

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

                  {/* Confidence */}

                  <div className="min-w-[150px] rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-center">
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

                {/* Detection Model Used */}

                <div className="mt-6 rounded-xl border border-blue-400/10 bg-blue-400/[0.03] p-4">
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

                {/* Confidence Bar */}

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

                {/* Model Information */}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Model
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.name}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Dataset
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.dataset}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Model Accuracy
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {currentModel.accuracy}
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}

                <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4">
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

            {/* ==================================
                PREDICTION HISTORY
            ================================== */}

            <section id="history" className="mt-16 scroll-mt-24">
              {/* History Header */}

              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    History
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">Recent Analyses</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest prediction results are saved in this browser.
                  </p>
                </div>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500 transition hover:border-red-400/20 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                    Clear History
                  </button>
                )}
              </div>

              {/* Empty History */}

              {history.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
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

              {/* History Items */}

              {history.length > 0 && (
                <div className="space-y-3">
                  {history.map((item) => {
                    const itemIsFake = item.prediction === 0;

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/20"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          {/* Content */}

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
                                Accuracy: {item.accuracy}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                              <Clock3 size={12} />

                              {item.time}
                            </div>

                            <button
                              type="button"
                              onClick={() => useHistoryItem(item)}
                              className="mt-4 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                            >
                              Use this text again →
                            </button>
                          </div>

                          {/* Confidence */}

                          <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              Confidence
                            </p>

                            <p
                              className={`mt-1 text-lg font-bold ${
                                itemIsFake ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {Number(item.confidence).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ==================================
                MODEL PERFORMANCE
            ================================== */}

            <section
              id="performance"
              className="mt-20 scroll-mt-24 border-t border-white/10 pt-20"
            >
              <div className="mx-auto max-w-6xl">
                {/* Heading */}

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

                {/* Performance Cards */}

                <div className="grid gap-6 lg:grid-cols-2">
                  {Object.values(performanceData).map((model) => (
                    <div
                      key={model.name}
                      className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 shadow-xl backdrop-blur-xl"
                    >
                      {/* Model Header */}

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

                      {/* Metrics */}

                      <div className="mt-7 grid grid-cols-2 gap-3">
                        {/* Accuracy */}

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Accuracy
                          </p>

                          <p className="mt-2 text-2xl font-bold text-blue-400">
                            {model.accuracy}
                          </p>
                        </div>

                        {/* Precision */}

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Precision
                          </p>

                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.precision}
                          </p>
                        </div>

                        {/* Recall */}

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Recall
                          </p>

                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.recall}
                          </p>
                        </div>

                        {/* F1 Score */}

                        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            F1 Score
                          </p>

                          <p className="mt-2 text-2xl font-bold text-slate-300">
                            {model.f1}
                          </p>
                        </div>
                      </div>

                      {/* Accuracy Bar */}

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

                {/* Note */}

                <div className="mt-6 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4">
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

        {/* ======================================
            HOW IT WORKS
        ====================================== */}

        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-white/10 px-6 py-24"
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
              {/* Step 1 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
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

              {/* Step 2 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
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

              {/* Step 3 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-blue-400/20">
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

        {/* ======================================
            ABOUT
        ====================================== */}

        <section id="about" className="scroll-mt-24 px-6 py-24">
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

      {/* ========================================
          FOOTER
      ======================================== */}

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />

            <span>TruthLens</span>
          </div>

          <p>Misinformation Detection using NLP</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
