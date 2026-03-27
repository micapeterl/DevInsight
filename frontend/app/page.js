"use client";

import { useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import axios from "axios";

const LANGUAGES = [
  "javascript", "typescript", "python", "java",
  "csharp", "cpp", "go", "rust", "html", "css",
];

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

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFixedCode(null);
    setShowDiff(false);

    try {
      const res = await axios.post("http://localhost:8000/analyze", {
        code,
        language,
      });
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze code. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const fixCode = async () => {
    setFixing(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:8000/fix", {
        code,
        language,
      });
      setFixedCode(res.data.fixed);
      setShowDiff(true);
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
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400">DevInsight</h1>
          <p className="text-gray-400 mt-1">AI-powered code analysis</p>
        </div>

        {!showDiff ? (
          <>
            {/* Language Selector */}
            <div className="mb-3 flex items-center gap-3">
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

                {/* Explanation */}
                <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                  <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                    What it does
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                {/* Bugs */}
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

                {/* Improvements */}
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

                {/* Fix Button */}
                <button
                  onClick={fixCode}
                  disabled={fixing}
                  className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:bg-green-900
                             disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {fixing ? "Fixing..." : "Fix My Code"}
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
                    setShowDiff(false);
                    setFixedCode(null);
                  }}
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
                }}
              />
            </div>
          </>
        )}

      </div>
    </main>
  );
}