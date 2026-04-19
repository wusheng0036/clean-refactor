'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

function RefactorPageInner() {
  const { data: session, status } = useSession();
  const [code, setCode] = useState('function hello() {\n  console.log("hello");\n}');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      checkStatus();
    } else {
      setChecking(false);
    }
  }, [session]);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/user/status');
      console.log('Status check response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Status data:', data);
        setIsPaid(data.isPaid);
      } else {
        console.error('Status check failed:', res.status);
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleRefactor = async () => {
    if (!code.trim()) return;
    if (!isPaid) {
      setError('Payment required');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, includeAnalysis: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResult(data.refactoredCode || '');
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    }

    setLoading(false);
  };

  if (status === 'loading' || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <button
            onClick={() => signIn('google', { callbackUrl: '/refactor' })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Code Refactor</h1>
            <p className="text-gray-400 text-sm">{session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg border ${isPaid ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-red-900/30 border-red-700 text-red-400'}`}>
              Status: {isPaid ? '⭐ PRO' : 'Free'}
            </div>
            <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Code Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Input Code</label>
              <button
                onClick={() => setCode('')}
                className="text-xs text-gray-400 hover:text-red-400"
              >
                Clear
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 bg-slate-800 text-white p-4 rounded-lg font-mono text-sm border border-slate-700"
              placeholder="Paste your code here..."
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Refactored Code</label>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="text-xs text-gray-400 hover:text-blue-400"
                disabled={!result}
              >
                Copy
              </button>
            </div>
            <textarea
              value={result}
              readOnly
              className="w-full h-64 bg-slate-800 text-green-400 p-4 rounded-lg font-mono text-sm border border-slate-700"
              placeholder="Result will appear here..."
            />
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleRefactor}
          disabled={loading || !isPaid}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg"
        >
          {loading ? 'Processing...' : isPaid ? '⚡ Refactor Code' : '🔒 Purchase Required'}
        </button>
      </div>
    </div>
  );
}

export default function RefactorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <RefactorPageInner />
    </Suspense>
  );
}
