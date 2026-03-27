"use client";

import { useState, useEffect } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import axios from "axios";

const LANGUAGES = [
  "javascript", "typescript", "python", "java",
  "csharp", "cpp", "go", "rust", "html", "css",
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Home() {
  const [code, setCode] = useState("// Paste your code here");
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fixedCode, setFixedCode] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("devinsight_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const saveToHistory = (code, language, result) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      language,
      preview: code.slice(0, 60).replace(/\n/g, " "),
      code,
      result,
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    setActiveHistoryId(entry.id);
    localStorage.setItem("devinsight_history", JSON.stringify(updated));
  };

  const resetToDefault = () => {
  setCode("// Paste your code here");
  setLanguage("javascript");
  setResult(null);
  setFixedCode(null);
  setShowDiff(false);
  setError(null);
  setActiveHistoryId(null);
  setUploadedFileName(null);
  };

  const loadFromHistory = (entry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setResult(entry.result);
    setFixedCode(entry.result?.fixedCode || null);
    setShowDiff(false);
    setError(null);
    setActiveHistoryId(entry.id);
  };

  const deleteHistoryEntry = (id, e) => {
    e.stopPropagation();
    const updated = history.filter((entry) => entry.id !== id);
    setHistory(updated);
    localStorage.setItem("devinsight_history", JSON.stringify(updated));

    if (id === activeHistoryId) {
      if (updated.length > 0) {
        loadFromHistory(updated[0]); // load most recent remaining entry
      } else {
        resetToDefault();
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("devinsight_history");
    resetToDefault();
  };

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFixedCode(null);
    setShowDiff(false);

    try {
      const res = await axios.post("http://localhost:8000/analyze", {
        code, language,
      });
      setResult(res.data);
      saveToHistory(code, language, res.data);
    } catch (err) {
      setError("Failed to analyze code. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const fixCode = async () => {
    // If fix already cached on current result, just show it
    if (result?.fixedCode) {
      setFixedCode(result.fixedCode);
      setShowDiff(true);
      return;
    }

    setFixing(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:8000/fix", {
        code, language,
      });
      const fixed = res.data.fixed;
      setFixedCode(fixed);
      setShowDiff(true);

      // Cache the fix in the current result state
      const updatedResult = { ...result, fixedCode: fixed };
      setResult(updatedResult);

      // Update the matching history entry
      const updatedHistory = history.map((entry) =>
        entry.code === code && entry.language === language
          ? { ...entry, result: updatedResult }
          : entry
      );
      setHistory(updatedHistory);
      localStorage.setItem("devinsight_history", JSON.stringify(updatedHistory));

    } catch (err) {
      setError("Failed to fix code. Make sure the backend is running.");
    }
    setFixing(false);
  };

  const copyFixed = () => {
    navigator.clipboard.writeText(fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">

      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 border-r 
                        border-gray-800 flex flex-col z-10">

        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-blue-400">DevInsight</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered code analysis</p>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">

            {/* History Header */}
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-2 py-2 
                         text-xs font-semibold text-gray-400 uppercase tracking-wide
                         hover:text-white transition-colors"
            >
              <span>History</span>
              <span>{historyOpen ? "▾" : "▸"}</span>
            </button>

            {/* History List */}
            {historyOpen && (
              <div className="mt-1 space-y-1">
                {history.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-gray-600 italic">
                    No analyses yet
                  </p>
                ) : (
                  <>
                    {history.map((entry) => (
                      <div key={entry.id} className="relative group">
                        <button
                          onClick={() => loadFromHistory(entry)}
                          className={`w-full text-left px-2 py-2 rounded-lg transition-colors pr-7
                            ${activeHistoryId === entry.id
                              ? "bg-gray-800 border border-gray-700"
                              : "hover:bg-gray-800"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-blue-400 capitalize">
                              {entry.language}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {entry.result?.fixedCode && (
                                <span className="text-xs text-green-500" title="Fix cached">✓</span>
                              )}
                              <span className="text-xs text-gray-600">
                                {formatTime(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {entry.preview}
                          </p>
                        </button>

                        {/* Delete button — appears on hover */}
                        <button
                          onClick={(e) => deleteHistoryEntry(entry.id, e)}
                          className="absolute top-2 right-1 opacity-0 group-hover:opacity-100
                                    text-gray-600 hover:text-red-400 transition-all text-xs px-1"
                          title="Delete entry"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Clear History */}
                    <button
                      onClick={clearHistory}
                      className="w-full mt-2 px-2 py-1.5 text-xs text-gray-600 
                                 hover:text-red-400 transition-colors text-left"
                    >
                      Clear history
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* ── Main Content ── */}
      <main className="ml-64 flex-1 p-8">
        <div className={showDiff ? "w-full" : "max-w-4xl mx-auto"}>

          {!showDiff ? (
            <>
              {/* Language Selector + File Upload */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400">Language:</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm
                              rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <label className="cursor-pointer px-4 py-1.5 bg-gray-800 hover:bg-gray-700 
                                  border border-gray-700 rounded-lg text-sm text-gray-300 
                                  hover:text-white transition-colors flex items-center gap-2">
                  <span>⬆</span>
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept=".js,.ts,.py,.java,.cs,.cpp,.go,.rs,.html,.css"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setUploadedFileName(file.name);
                      if (!file) return;

                      // Auto-detect language from extension
                      const ext = file.name.split(".").pop().toLowerCase();
                      const extMap = {
                        js: "javascript",
                        ts: "typescript",
                        py: "python",
                        java: "java",
                        cs: "csharp",
                        cpp: "cpp",
                        go: "go",
                        rs: "rust",
                        html: "html",
                        css: "css",
                      };
                      if (extMap[ext]) setLanguage(extMap[ext]);

                      // Read file contents into editor
                      const reader = new FileReader();
                      reader.onload = (ev) => setCode(ev.target.result);
                      reader.readAsText(file);

                      // Reset analysis state
                      setResult(null);
                      setFixedCode(null);
                      setShowDiff(false);
                      setError(null);

                      // Reset input so same file can be re-uploaded
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Editor */}
              <div className="rounded-lg overflow-hidden border border-gray-700 mb-4">
                <Editor
                  height="350px"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzeCode}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900
                           disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {loading ? "Analyzing..." : "Analyze Code"}
              </button>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="mt-6 space-y-4">

                  <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                    <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                      What it does
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                    <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
                      Bugs & Issues
                    </h2>
                    {result.bugs.length === 0 ? (
                      <p className="text-gray-500 text-sm">No bugs detected.</p>
                    ) : (
                      <ul className="space-y-2">
                        {result.bugs.map((bug, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-300">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{bug}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                    <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3">
                      Improvements
                    </h2>
                    {result.improvements.length === 0 ? (
                      <p className="text-gray-500 text-sm">No improvements suggested.</p>
                    ) : (
                      <ul className="space-y-2">
                        {result.improvements.map((imp, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-300">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={fixCode}
                    disabled={fixing}
                    className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:bg-green-900
                              disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  >
                    {fixing ? "Fixing..." : result?.fixedCode ? "View Fix" : "Fix My Code"}
                  </button>

                </div>
              )}
            </>
          ) : (
            <>
              {/* Diff View */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-red-900 inline-block"></span>
                    Original
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-green-900 inline-block"></span>
                    Fixed
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyFixed}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm
                               font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Fixed Code"}
                  </button>
                  <button
                    onClick={() => {
                      const extMap = {
                        javascript: "js", typescript: "ts", python: "py",
                        java: "java", csharp: "cs", cpp: "cpp",
                        go: "go", rust: "rs", html: "html", css: "css",
                      };
                      const ext = extMap[language] || "txt";
                      const filename = uploadedFileName
                        ? uploadedFileName.replace(/\.[^.]+$/, `_fixed.${ext}`)
                        : `fixed_code.${ext}`;

                      const blob = new Blob([fixedCode], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = filename;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm
                              font-medium transition-colors"
                  >
                    ⬇ Download
                  </button>
                  <button
                    onClick={() => { setShowDiff(false); setFixedCode(null); }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm
                               font-medium transition-colors"
                  >
                    ← Back to Analysis
                  </button>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-gray-700">
                <DiffEditor
                  height="600px"
                  language={language}
                  theme="vs-dark"
                  original={code}
                  modified={fixedCode}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    readOnly: true,
                    renderSideBySide: true,
                    enableSplitViewResizing: true,
                    originalEditable: false,
                  }}
                />
              </div>
            </>
          )}

        </div>
      </main>

    </div>
  );
}