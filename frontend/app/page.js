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
      setResult(res.data.result);
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
          <div className="mt-6 p-6 bg-gray-900 border border-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-400 mb-4">Analysis</h2>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
              {result}
            </pre>
          </div>
        )}

      </div>
    </main>
  );
}