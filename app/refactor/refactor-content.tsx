"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

interface UserCredits {
  credits: number;
  isPaid: boolean;
}

export function RefactorContent() {
  const { data: session, status } = useSession();
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
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  // 获取用户积分
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserCredits();
    } else {
      setCreditsLoading(false);
    }
  }, [session]);

  const fetchUserCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleRefactor = async () => {
    if (!code.trim()) return;
    
    // 检查积分
    if (userCredits && userCredits.credits <= 0 && !userCredits.isPaid) {
      setError("No credits remaining. Please upgrade to continue.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult("");
    
    try {
      const res = await fetch("/api/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data.refactoredCode);
        // 刷新积分
        fetchUserCredits();
      }
    } catch (error: any) {
      setError(error.message || "Error processing code");
    }
    
    setLoading(false);
  };

  // 未登录状态
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">AI Code Refactor</h1>
          <p className="text-gray-400 mb-8">Sign in to start refactoring your code with AI</p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/refactor" })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Sign in with Google
          </button>
          <p className="mt-4 text-sm text-gray-500">
            <Link href="/" className="text-blue-400 hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  // 加载中
  if (status === "loading" || creditsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const hasCredits = userCredits && (userCredits.credits > 0 || userCredits.isPaid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Code Refactor</h1>
            <p className="text-gray-400 text-sm mt-1">
              {session?.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 积分显示 */}
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <span className="text-gray-400 text-sm">Credits: </span>
              <span className={`font-bold ${hasCredits ? 'text-green-400' : 'text-red-400'}`}>
                {userCredits?.credits ?? 0}
              </span>
              {userCredits?.isPaid && (
                <span className="ml-2 text-yellow-400 text-xs">⭐ PRO</span>
              )}
            </div>
            <Link 
              href="/" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* 无积分提示 */}
        {!hasCredits && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300">
              You have no credits remaining. 
              <Link href="/#pricing" className="ml-2 text-blue-400 hover:underline">
                Upgrade now →
              </Link>
            </p>
          </div>
        )}

        {/* 代码编辑器 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="text-white mb-2 block font-medium">Your Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 bg-slate-800 text-white p-4 rounded-lg font-mono text-sm border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Paste your code here..."
            />
            <button
              onClick={handleRefactor}
              disabled={loading || !hasCredits}
              className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {loading ? "Processing..." : hasCredits ? "Refactor Code" : "No Credits"}
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
                className="w-full h-96 bg-slate-800 text-green-400 p-4 rounded-lg font-mono text-sm border border-slate-700 resize-none"
                placeholder="Refactored code will appear here..."
              />
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">🆓 Free Trial</h3>
            <p className="text-gray-400 text-sm">3 free credits for new users</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">⚡ Fast Processing</h3>
            <p className="text-gray-400 text-sm">AI-powered code improvement in seconds</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">🔒 Secure</h3>
            <p className="text-gray-400 text-sm">Your code is processed securely and not stored</p>
          </div>
        </div>
      </div>
    </div>
  );
}
