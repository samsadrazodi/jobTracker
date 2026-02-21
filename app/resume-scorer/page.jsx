"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  ChevronDown,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Score ring component ───────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label =
    score >= 75 ? "Strong Match" : score >= 50 ? "Partial Match" : "Weak Match";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/30"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-0.5 text-xs font-semibold"
        style={{
          background: color + "22",
          color,
          border: `1px solid ${color}55`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Keyword chip ────────────────────────────────────────────────────────
function KeywordChip({ word, found }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        found
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-red-400/30 bg-red-400/10 text-red-500 dark:text-red-400"
      )}
    >
      {found ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 shrink-0" />
      )}
      {word}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function ResumeScorerPage() {
  const supabase = createClient();

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch resumes
  useEffect(() => {
    const fetchResumes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("resumes")
        .select("id, version_name, file_name, file_url, file_path")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setResumes(data);
    };
    fetchResumes();
  }, []);

  // ─── Extract PDF text via pdf.js CDN ────────────────────────────────
  const extractPdfText = async (fileUrl) => {
    // Dynamically load pdf.js from CDN
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }

    const pdf = await window.pdfjsLib.getDocument(fileUrl).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return fullText.trim();
  };

  // ─── Get signed URL for resume ───────────────────────────────────────
  const getResumeUrl = async (resume) => {
    if (resume.file_url) return resume.file_url;

    const { data } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.file_path, 300);

    return data?.signedUrl ?? null;
  };

  // ─── Call Claude API ─────────────────────────────────────────────────
  const callClaude = async (resumeText, jobDesc) => {
    const response = await fetch("/api/score-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription: jobDesc }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to score resume");
    }

    return response.json();
  };

  // ─── Handle analyze ──────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      setLoadingStep("Fetching resume file…");
      const fileUrl = await getResumeUrl(selectedResume);
      if (!fileUrl) throw new Error("Could not load resume file.");

      setLoadingStep("Extracting text from PDF…");
      const resumeText = await extractPdfText(fileUrl);
      if (!resumeText) throw new Error("Could not extract text from PDF.");

      setLoadingStep("Analyzing with AI…");
      const data = await callClaude(resumeText, jobDescription);

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const canAnalyze = selectedResume && jobDescription.trim().length > 50 && !loading;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-widest">
            AI-Powered
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Resume Scorer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Match your resume against a job description and get an ATS-style score
          with actionable feedback.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Inputs ── */}
        <div className="space-y-5">
          {/* Resume selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Resume
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  "border-border bg-card text-foreground hover:border-primary/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedResume ? (
                    <span>
                      <span className="font-medium">
                        {selectedResume.version_name}
                      </span>
                      <span className="ml-1.5 text-muted-foreground">
                        — {selectedResume.file_name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {resumes.length === 0
                        ? "No resumes uploaded yet"
                        : "Choose a resume…"}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {dropdownOpen && resumes.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                  {resumes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedResume(r);
                        setDropdownOpen(false);
                        setResult(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent",
                        selectedResume?.id === r.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.version_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.file_name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {dropdownOpen && resumes.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover px-4 py-6 text-center shadow-lg">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No resumes found. Upload one in{" "}
                    <a href="/settings" className="text-primary underline">
                      Settings
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Job description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Job Description
            </label>
            <div className="relative">
              <textarea
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setResult(null);
                }}
                placeholder="Paste the full job description here…"
                rows={14}
                className={cn(
                  "w-full resize-none rounded-lg border px-3 py-2.5 text-sm",
                  "border-border bg-card text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "transition-colors hover:border-primary/50"
                )}
              />
              {!jobDescription && (
                <ClipboardPaste className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {jobDescription.length} characters
              {jobDescription.length > 0 && jobDescription.length < 50 && (
                <span className="ml-1 text-amber-500">
                  — paste more of the job description for better results
                </span>
              )}
            </p>
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              canAnalyze
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingStep}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Resume
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-500">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div>
          {!result && !loading && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                Your analysis will appear here
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Select a resume and paste a job description to get started.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-8">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{loadingStep}</p>
              <p className="mt-1 text-xs text-muted-foreground">This takes ~10 seconds</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Score */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-lg font-bold text-foreground">
                      ATS Compatibility Score
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Keyword Analysis
                </h3>
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-green-500">
                    Matched ({result.matchedKeywords?.length ?? 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords?.length > 0 ? (
                      result.matchedKeywords.map((kw) => (
                        <KeywordChip key={kw} word={kw} found />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-red-500">
                    Missing ({result.missingKeywords?.length ?? 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords?.length > 0 ? (
                      result.missingKeywords.map((kw) => (
                        <KeywordChip key={kw} word={kw} found={false} />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None — great coverage!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Actionable Suggestions
                  </h3>
                  <ul className="space-y-2.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section scores */}
              {result.sectionScores && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Section Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(result.sectionScores).map(([section, score]) => (
                      <div key={section}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">
                            {section}
                          </span>
                          <span className="font-semibold text-foreground">
                            {score}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}