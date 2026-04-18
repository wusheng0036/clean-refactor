"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

interface UserStatus {
  isPaid: boolean;
}

interface AnalysisItem {
  category: string;
  before: string;
  after: string;
}

interface SuggestionItem {
  priority: "high" | "medium" | "low";
  issue: string;
  recommendation: string;
}

interface AnalysisResult {
  summary: string;
  improvements: AnalysisItem[];
  suggestions: SuggestionItem[];
  score: { before: number; after: number };
}

interface ExecutionTraceResult {
  predictedOrder: string[];
  explanation: { step: number; action: string; output: string; reason: string }[];
  eventLoopPhases: {
    sync: string[];
    microtask1: string[];
    microtask2: string[];
    microtask3: string[];
    macrotask: string[];
  };
  keyInsight: string;
}

export function RefactorContent() {
  const { data: session, status } = useSession();
  const [code, setCode] = useState(`function getData(id,cb){
db.query('select * from users where id='+id,function(e,u){
if(e){cb(e);return;}
if(u.length==0){cb('no user');return;}
var user=u[0];
db.query('select * from orders where uid='+user.id,function(e,o){
if(e){cb(e);return;}
var total=0;
for(var i=0;i<o.length;i++){
if(o[i].status==1){
total+=o[i].amount;
}
}
cb(null,{user:user,orders:o,total:total});
});
});
}`);
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTraceResult | null>(null);
  const [mode, setMode] = useState<"refactor" | "execution-trace">("refactor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activating, setActivating] = useState(false);

  // 获取用户付费状态
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserStatus();
    } else {
      setStatusLoading(false);
    }
  }, [session]);

  const fetchUserStatus = async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        setUserStatus(data);
        // 如果是付费用户，显示欢迎弹窗
        if (data.isPaid) {
          setShowWelcome(true);
          // 3秒后自动关闭
          setTimeout(() => setShowWelcome(false), 5000);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // 手动激活
  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch('/api/test-activate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchUserStatus(); // 刷新状态
        alert('Activated! You can now use the tool.');
      } else {
        alert('Activation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setActivating(false);
  };

  const handleRefactor = async () => {
    if (!code.trim()) return;
    
    // 检查用户是否已付费
    if (!userStatus?.isPaid) {
      setError("Payment required. Please purchase to continue.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult("");
    setAnalysis(null);
    setExecutionTrace(null);
    setMode("refactor");
    
    try {
      const res = await fetch("/api/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, includeAnalysis: true }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data.refactoredCode);
        setMode(data.mode || "refactor");
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
        if (data.executionTrace) {
          setExecutionTrace(data.executionTrace);
        }
      }
    } catch (error: any) {
      setError(error.message || "Error processing code");
    }
    
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClear = () => {
    setCode("");
    setResult("");
    setAnalysis(null);
    setExecutionTrace(null);
    setMode("refactor");
    setError("");
  };

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

  if (status === "loading" || statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const isPaid = userStatus?.isPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      {/* 付费用户欢迎弹窗 */}
      {showWelcome && isPaid && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-8 rounded-2xl shadow-2xl max-w-md text-center animate-bounce">
            <div className="text-6xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, PRO Member!</h2>
            <p className="text-white/90 mb-4">You have lifetime access to CleanRefactor AI.</p>
            <div className="text-4xl font-bold text-white">⭐ PRO</div>
            <button 
              onClick={() => setShowWelcome(false)}
              className="mt-6 px-6 py-2 bg-white text-amber-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Refactoring
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">AI Code Refactor</h1>
            <p className="text-gray-400 text-sm mt-1">{session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* 付费状态显示 */}
            <div className={`px-4 py-2 rounded-lg border ${isPaid ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500' : 'bg-red-900/30 border-red-700'}`}>
              <span className="text-gray-400 text-sm">Status: </span>
              <span className={`font-bold ${isPaid ? 'text-yellow-400' : 'text-red-400'}`}>
                {isPaid ? '⭐ PRO' : 'Free'}
              </span>
              <button 
                onClick={fetchUserStatus}
                className="ml-2 text-xs text-gray-500 hover:text-white"
                title="Refresh status"
              >
                🔄
              </button>
            </div>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Home</Link>
          </div>
        </div>

        {/* 未付费提示 */}
        {!isPaid && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300">
              Payment required to use this tool.
              <Link href="/#pricing" className="ml-2 text-blue-400 hover:underline">Purchase Now →</Link>
            </p>
          </div>
        )}

        {/* Code Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Input */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Input Code</label>
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 min-h-[250px] bg-slate-800 text-white p-4 rounded-lg font-mono text-sm border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Paste your code here..."
            />
          </div>
          
          {/* Output */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Refactored Code</label>
              {result && (
                <button onClick={handleCopy} className={`text-xs flex items-center gap-1 ${copied ? 'text-green-400' : 'text-gray-400 hover:text-blue-400'}`}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              )}
            </div>
            {error ? (
              <div className="flex-1 min-h-[250px] bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-2">Error:</p>
                <p>{error}</p>
              </div>
            ) : (
              <textarea
                value={result}
                readOnly
                className="flex-1 min-h-[250px] bg-slate-800 text-green-400 p-4 rounded-lg font-mono text-sm border border-slate-700 resize-none"
                placeholder="Refactored code will appear here..."
              />
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRefactor}
          disabled={loading || !isPaid}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mb-6"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : isPaid ? (
            <>⚡ Refactor Code</>
          ) : (
            "🔒 Purchase Required"
          )}
        </button>

        {/* Execution Trace Analysis */}
        {executionTrace && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">🔍 Execution Order Analysis</h2>
              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Event Loop</span>
            </div>
            
            {/* Predicted Order */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Predicted Output Order:</h3>
              <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm">
                {executionTrace.predictedOrder?.map((item, idx) => (
                  <span key={idx}>
                    <span className="text-green-400">"{item}"</span>
                    {idx < executionTrace.predictedOrder!.length - 1 && (
                      <span className="text-gray-500"> → </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Event Loop Phases */}
            {executionTrace.eventLoopPhases && (
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2">Event Loop Phases:</h3>
                <div className="space-y-2">
                  <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">
                    <span className="text-blue-400 font-medium text-sm">1. Sync:</span>
                    <span className="text-gray-300 text-sm ml-2">{executionTrace.eventLoopPhases.sync?.join(' → ')}</span>
                  </div>
                  <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700">
                    <span className="text-yellow-400 font-medium text-sm">2. Microtasks:</span>
                    <div className="text-gray-300 text-sm mt-1">
                      {executionTrace.eventLoopPhases.microtask1?.length > 0 && (
                        <div>Round 1: {executionTrace.eventLoopPhases.microtask1.join(' → ')}</div>
                      )}
                      {executionTrace.eventLoopPhases.microtask2?.length > 0 && (
                        <div>Round 2: {executionTrace.eventLoopPhases.microtask2.join(' → ')}</div>
                      )}
                      {executionTrace.eventLoopPhases.microtask3?.length > 0 && (
                        <div>Round 3: {executionTrace.eventLoopPhases.microtask3.join(' → ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-red-900/30 p-3 rounded-lg border border-red-700">
                    <span className="text-red-400 font-medium text-sm">3. Macrotask:</span>
                    <span className="text-gray-300 text-sm ml-2">{executionTrace.eventLoopPhases.macrotask?.join(' → ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Key Insight */}
            {executionTrace.keyInsight && (
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-700">
                <h3 className="text-purple-400 font-medium mb-1">💡 Key Insight:</h3>
                <p className="text-gray-300 text-sm">{executionTrace.keyInsight}</p>
              </div>
            )}

            {/* Step by Step */}
            {executionTrace.explanation && executionTrace.explanation.length > 0 && (
              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">Step by Step:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {executionTrace.explanation.map((step, idx) => (
                    <div key={idx} className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold text-sm">{step.step}.</span>
                        <div>
                          <span className="text-gray-300 text-sm">{step.action}</span>
                          <span className="text-green-400 text-sm ml-2">→ "{step.output}"</span>
                          <p className="text-gray-500 text-xs mt-1">{step.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Review Analysis */}
        {analysis && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">📊 Code Review Analysis</h2>
              <button onClick={() => setShowAnalysis(!showAnalysis)} className="text-sm text-blue-400 hover:text-blue-300">
                {showAnalysis ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {/* Score */}
            <div className="flex gap-4 mb-4">
              <div className="bg-red-900/30 px-4 py-2 rounded-lg">
                <span className="text-gray-400 text-sm">Before: </span>
                <span className="text-red-400 font-bold text-xl">{analysis.score?.before}/10</span>
              </div>
              <div className="text-gray-500 text-2xl">→</div>
              <div className="bg-green-900/30 px-4 py-2 rounded-lg">
                <span className="text-gray-400 text-sm">After: </span>
                <span className="text-green-400 font-bold text-xl">{analysis.score?.after}/10</span>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{analysis.summary}</p>

            {showAnalysis && (
              <>
                {/* Improvements */}
                {analysis.improvements && analysis.improvements.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-white font-medium mb-2">✅ Key Improvements</h3>
                    <div className="space-y-2">
                      {analysis.improvements.map((item, idx) => (
                        <div key={idx} className="bg-slate-700/50 p-3 rounded-lg">
                          <span className="text-blue-400 text-sm font-medium">{item.category}: </span>
                          <span className="text-red-400 text-sm line-through">{item.before}</span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="text-green-400 text-sm">{item.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-2">💡 Further Suggestions</h3>
                    <div className="space-y-2">
                      {analysis.suggestions.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${
                          item.priority === 'high' ? 'bg-red-900/20 border-red-700' :
                          item.priority === 'medium' ? 'bg-yellow-900/20 border-yellow-700' :
                          'bg-blue-900/20 border-blue-700'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              item.priority === 'high' ? 'bg-red-600' :
                              item.priority === 'medium' ? 'bg-yellow-600' :
                              'bg-blue-600'
                            } text-white`}>{item.priority.toUpperCase()}</span>
                            <span className="text-gray-300 text-sm">{item.issue}</span>
                          </div>
                          <p className="text-gray-400 text-sm ml-14">{item.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">💎 Lifetime Access</h3>
            <p className="text-gray-400 text-sm">One-time payment, unlimited use</p>
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
