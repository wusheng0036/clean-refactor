'use client';

import dynamic from 'next/dynamic';

const RefactorContent = dynamic(() => import('./refactor-content').then(mod => mod.RefactorContent), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center text-white">Loading...</div>
});

export default function RefactorPage() {
  return <RefactorContent />;
}
