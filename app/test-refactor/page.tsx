"use client";

import { useState } from "react";

export default function TestRefactorPage() {
  const [code, setCode] = useState(`function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum = sum + arr[i];
  }
  return sum;
}`);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRefactor = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError("");
    setResult("");
    
    try {
      const res = await fetch("/api/test-refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Unknown error");
        console.error("API Error:", data);
      } else {
        setResult(data.refactoredCode);
        console.log("Success:", data);
      }
    } catch (error: any) {
      setError(error.message || "Error processing code");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Test AI Refactor</h1>
        <p className="text-gray-400 mb-6">No login required - Testing OpenAI API integration</p>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-white mb-2 block font-medium">Your Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 bg-slate-800 text-white p-4 rounded-lg font-mono text-sm border border-slate-700 focus:border-blue-500 focus:outline-none"
              placeholder="Paste your code here..."
            />
            <button
              onClick={handleRefactor}
              disabled={loading}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing..." : "Refactor Code"}
            </button>
          </div>
          
          <div>
            <label className="text-white mb-2 block font-medium">Refactored Code</label>
            {error ? (
              <div className="w-full h-96 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg font-mono text-sm overflow-auto">
                <p className="font-bold mb-2">Error:</p>
                <p>{error}</p>
              </div>
            ) : (
              <textarea
                value={result}
                readOnly
                className="w-full h-96 bg-slate-800 text-green-400 p-4 rounded-lg font-mono text-sm border border-slate-700"
                placeholder="Refactored code will appear here..."
              />
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
          <h3 className="text-white font-medium mb-2">Test Instructions:</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>1. This page bypasses login for testing purposes</li>
            <li>2. Click "Refactor Code" to test OpenAI API</li>
            <li>3. If successful, you will see improved code on the right</li>
            <li>4. Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
