import dynamic from 'next/dynamic';

export const dynamicConfig = 'force-dynamic';

const RefactorContent = dynamic(() => import('./refactor-content').then(mod => mod.RefactorContent), {
  ssr: false,
});

export default function RefactorPage() {
  return <RefactorContent />;
}
