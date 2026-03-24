"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function Home() {
  const [code, setCode] = useState("// Paste your code here");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/analyze", { code });
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze code. Make sure the backend is running.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400">DevInsight</h1>
          <p className="text-gray-400 mt-1">AI-powered code analysis</p>
        </div>

        {/* Editor */}
        <div className="rounded-lg overflow-hidden border border-gray-700 mb-4">
          <Editor
            height="350px"
            defaultLanguage="javascript"
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

          </div>
        )}

      </div>
    </main>
  );
}