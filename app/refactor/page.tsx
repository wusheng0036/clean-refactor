'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Trash2, 
  Home, 
  Crown, 
  Zap, 
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Code2,
  Terminal
} from 'lucide-react';

function RefactorPageInner() {
  const { data: session, status } = useSession();
  const [code, setCode] = useState(`// Paste your code here or try an example:
// 1. Regular code for refactoring
// 2. JavaScript event loop questions

function example() {
  console.log('Start');
  setTimeout(() => console.log('Timeout'), 0);
  Promise.resolve().then(() => console.log('Promise'));
  console.log('End');
}`);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [executionTrace, setExecutionTrace] = useState<any>(null);
  const [mode, setMode] = useState<'refactor' | 'execution-trace'>('refactor');
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const res = await fetch('/api/user/status');
          if (res.ok) {
            const data = await res.json();
            console.log('Setting isPaid to:', data.isPaid);
            setIsPaid(data.isPaid === true);
          }
        } catch (err) {
          console.error('Status check failed:', err);
        }
      }
      setChecking(false);
    };
    
    if (status !== 'loading') {
      checkUserStatus();
    }
  }, [status, session]);

  const handleRefactor = async () => {
    if (!code.trim()) return;
    if (!isPaid) {
      setError('Payment required');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setAnalysis(null);
    setExecutionTrace(null);

    try {
      const res = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, includeAnalysis: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResult(data.refactoredCode || '');
        setMode(data.mode || 'refactor');
        setExecutionTrace(data.executionTrace || null);
        setAnalysis(data.analysis || null);
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCode('');
    setResult('');
    setError('');
    setAnalysis(null);
    setExecutionTrace(null);
  };

  const loadExample = (type: 'refactor' | 'eventloop') => {
    if (type === 'eventloop') {
      setCode(`console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

console.log('4');

// What's the output order?`);
    } else {
      setCode(`function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}`);
    }
  };

  if (status === 'loading' || checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-slate-400 mb-6">Please sign in to access the AI code refactoring tool.</p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/refactor' })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-all"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">CleanRefactor AI</h1>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isPaid ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">PRO</span>
                </div>
              ) : (
                <Link 
                  href="/#pricing" 
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition-colors"
                >
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Upgrade to PRO</span>
                </Link>
              )}
              <Link 
                href="/" 
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Examples */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 py-2">Quick examples:</span>
          <button
            onClick={() => loadExample('refactor')}
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Refactoring
          </button>
          <button
            onClick={() => loadExample('eventloop')}
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Event Loop
          </button>
        </div>

        {/* Code Editors with Center Button */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 mb-6 items-stretch">
          {/* Input */}
          <div className="bg-[#13131a] rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#1a1a24]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Input Code</span>
              </div>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 bg-[#13131a] text-slate-300 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Paste your code here..."
              spellCheck={false}
            />
          </div>

          {/* Center Refactor Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleRefactor}
              disabled={loading || !isPaid}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-6 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/30 disabled:shadow-none min-w-[140px]"
            >
              <div className="relative flex flex-col items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </>
                ) : !isPaid ? (
                  <>
                    <Lock className="w-8 h-8" />
                    <span className="text-xs">PRO Only</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Refactor</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Output */}
          <div className="bg-[#13131a] rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#1a1a24]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Refactored Code</span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!result}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              value={result}
              readOnly
              className="w-full h-80 bg-[#13131a] text-emerald-400 p-4 font-mono text-sm resize-none focus:outline-none"
              placeholder="Result will appear here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Analysis Section */}
        {analysis && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-[#13131a] rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Code Quality Score</h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={analysis.score >= 80 ? 'text-emerald-400' : analysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'}
                      strokeDasharray={`${analysis.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{analysis.score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-[#13131a] rounded-xl border border-slate-800 p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Key Improvements</h3>
              </div>
              <ul className="space-y-3">
                {analysis.improvements?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Execution Trace Analysis */}
        {mode === 'execution-trace' && executionTrace && (
          <div className="mt-8 bg-[#13131a] rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#1a1a24]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Execution Order Analysis</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Predicted Order */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Predicted Output Order</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {executionTrace.predictedOrder?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center">
                      <div className="px-4 py-2 bg-slate-800 rounded-lg font-mono text-sm text-emerald-400 border border-slate-700">
                        {item}
                      </div>
                      {i < executionTrace.predictedOrder.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-600 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insight */}
              {executionTrace.keyInsight && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-purple-400 mb-1">Key Insight</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{executionTrace.keyInsight}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RefactorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <RefactorPageInner />
    </Suspense>
  );
}