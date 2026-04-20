'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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

// Dynamic import for CodeEditor with SSR disabled
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Loading editor...
    </div>
  ),
});

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
  const [usedModel, setUsedModel] = useState<string>('');

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
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error + (data.details ? `: ${data.details}` : '') || 'Request failed');
      } else {
        setMode(data.mode || 'refactor');
        setExecutionTrace(data.executionTrace || null);
        setUsedModel(data.model || '');
        
        // For execution trace mode, format the result nicely
        if (data.mode === 'execution-trace' && data.executionTrace) {
          const trace = data.executionTrace;
          let formattedResult = '// Execution Order Analysis\n\n';
          
          if (trace.predictedOrder) {
            formattedResult += '// Predicted Output Order:\n';
            formattedResult += trace.predictedOrder.join(' → ');
            formattedResult += '\n\n';
          }
          
          if (trace.keyInsight) {
            formattedResult += '// Key Insight:\n';
            formattedResult += trace.keyInsight;
          }
          
          setResult(formattedResult);
        } else {
          // Clean up markdown code blocks if present
          let cleanCode = data.refactoredCode || '';
          cleanCode = cleanCode.replace(/^```typescript\n?/, '');
          cleanCode = cleanCode.replace(/^```javascript\n?/, '');
          cleanCode = cleanCode.replace(/^```\n?/, '');
          cleanCode = cleanCode.replace(/\n?```$/, '');
          setResult(cleanCode);
        }
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

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refactored-code.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Header - Minimal */}
      <header className="border-b border-slate-800/50 bg-[#0a0a0f]/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-14">
            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-500/30 border border-yellow-400/50 rounded-full shadow-lg shadow-yellow-500/20">
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold text-yellow-300">PRO</span>
                </div>
              ) : (
                <Link 
                  href="/#pricing" 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-full transition-all shadow-lg"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Upgrade</span>
                </Link>
              )}
              <Link 
                href="/" 
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#13131a] border border-slate-700 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">AI Refactoring...</h3>
              <p className="text-sm text-slate-400">This may take 10-30 seconds</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full animate-[shimmer_2s_infinite] w-1/2" />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Logo & Title - Centered, Large */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 cursor-pointer group">
              <Sparkles className="w-8 h-8 text-white group-hover:animate-spin" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">CleanRefactor AI</h1>
          </div>
        </div>

        {/* User Greeting - Centered with Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-blue-500/30 rounded-full shadow-lg shadow-blue-500/10">
            <span className="text-lg">👋</span>
            <span className="text-sm text-slate-300">Hey, </span>
            <span className="text-sm font-semibold text-white">{session?.user?.name || session?.user?.email?.split('@')[0] || '开发者'}</span>
          </div>
        </div>

        {/* Model Indicator */}
        {usedModel && (
          <div className="flex justify-center mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              usedModel === 'zhipu' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {usedModel === 'zhipu' ? '智谱 GLM-4' : 'SiliconFlow DeepSeek'}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Examples - Centered with Background Box, Smaller */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-6 py-4 bg-[#13131a]/80 border border-slate-700/50 rounded-2xl shadow-xl shadow-black/20">
            <span className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Try an example:
            </span>
            <button
              onClick={() => loadExample('refactor')}
              className="group flex items-center gap-2 px-4 py-2 text-sm bg-slate-800/80 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5"
            >
              <Code2 className="w-4 h-4 group-hover:scale-110 group-hover:rotate-3 transition-transform" />
              Refactoring
            </button>
            <button
              onClick={() => loadExample('eventloop')}
              className="group flex items-center gap-2 px-4 py-2 text-sm bg-slate-800/80 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-purple-400 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
            >
              <Terminal className="w-4 h-4 group-hover:scale-110 group-hover:rotate-3 transition-transform" />
              Event Loop
            </button>
          </div>
        </div>

        {/* Used Model Display */}
        {usedModel && (
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              usedModel === 'zhipu' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              <span>AI Model:</span>
              <span>{usedModel === 'zhipu' ? '智谱 GLM-4' : '硅基 DeepSeek'}</span>
              {usedModel === 'zhipu' && <span className="text-[10px] opacity-70">(auto)</span>}
            </div>
          </div>
        )}

        {/* Code Editors with Center Button - Mobile: vertical stack, Desktop: side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 mb-8">
          {/* Input - Bright Green Background */}
          <div className="group rounded-2xl border border-emerald-600/40 overflow-hidden shadow-2xl shadow-black/20 hover:border-emerald-400/50 hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-700/40 bg-gradient-to-r from-emerald-800/80 to-teal-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/40 to-teal-500/30 rounded-lg flex items-center justify-center border border-emerald-400/40">
                  <Code2 className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-sm font-semibold text-emerald-50">Input Code</span>
              </div>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all hover:scale-105"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="h-64 lg:h-96 bg-gradient-to-br from-emerald-800/50 via-teal-800/40 to-emerald-700/50">
              <CodeEditor
                code={code}
                onChange={setCode}
                placeholder="Paste your code here..."
              />
            </div>
          </div>

          {/* Center Refactor Button - Subtle 3D */}
          <div className="flex items-center justify-center py-2 lg:py-0 order-first lg:order-none">
            <button
              onClick={handleRefactor}
              disabled={loading || !isPaid}
              className="group relative disabled:cursor-not-allowed min-w-[120px] lg:min-w-[140px]"
            >
              {/* Subtle 3D Shadow */}
              <div className="absolute inset-0 bg-purple-600/50 rounded-2xl translate-y-1.5 group-hover:translate-y-2 group-active:translate-y-0.5 transition-transform duration-150 blur-sm" />
              
              {/* Button Face */}
              <div className={`
                relative flex flex-col items-center gap-1.5 py-4 px-8 rounded-2xl
                bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500
                disabled:from-slate-600 disabled:via-slate-700 disabled:to-slate-800
                transition-all duration-150
                group-hover:-translate-y-0.5 group-active:translate-y-0.5
              `}>
                {/* Top shine */}
                <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                
                <div className="relative flex flex-col items-center gap-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-medium">Analyzing...</span>
                    </>
                  ) : !isPaid ? (
                    <>
                      <Lock className="w-8 h-8" />
                      <span className="text-xs font-medium">PRO Only</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-10 h-10 group-hover:scale-105 transition-transform duration-200" />
                      <span className="text-base font-bold tracking-wide">Refactor</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Output - Bright Green Background */}
          <div className="group rounded-2xl border border-emerald-600/40 overflow-hidden shadow-2xl shadow-black/20 hover:border-emerald-400/50 hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-700/40 bg-gradient-to-r from-emerald-800/80 to-teal-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/40 to-teal-500/30 rounded-lg flex items-center justify-center border border-emerald-400/40">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-sm font-semibold text-emerald-50">Refactored Code</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!result}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300/80 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!result}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300/80 hover:text-green-400 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="h-64 lg:h-96 bg-gradient-to-br from-emerald-800/50 via-teal-800/40 to-emerald-700/50">
              <CodeEditor
                code={result}
                readOnly
                placeholder="Result will appear here..."
              />
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {analysis && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="group bg-[#13131a] rounded-xl border border-slate-800 p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
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
            <div className="group bg-[#13131a] rounded-xl border border-slate-800 p-6 lg:col-span-2 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-white">Key Improvements</h3>
              </div>
              <ul className="space-y-3">
                {analysis.improvements?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 group/item hover:text-slate-200 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Execution Trace Analysis */}
        {mode === 'execution-trace' && executionTrace && (
          <div className="mt-8 bg-[#13131a] rounded-xl border border-slate-800 overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#1a1a24] to-[#1a1a24]/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Execution Order Analysis</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Predicted Order */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Predicted Output Order
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {executionTrace.predictedOrder?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center">
                      <div className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-mono text-sm text-emerald-400 border border-slate-700 hover:border-emerald-500/30 transition-all cursor-default">
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
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-purple-400" />
                    </div>
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