import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, updated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
          ← Back to CleanRefactor AI
        </Link>
        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CleanRefactor AI</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
          <p className="mt-4 text-sm text-slate-500">Last updated: {updated}</p>
        </header>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">{section.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-slate-700">
          <p>
            This page is a practical baseline for a small practice project and is not legal advice. For formal legal
            requirements, consult a qualified professional.
          </p>
          <p className="mt-3">
            Contact: use the GitHub repository issue tracker at{" "}
            <a className="font-semibold text-blue-600 hover:text-blue-500" href="https://github.com/wusheng0036/clean-refactor/issues" rel="noreferrer" target="_blank">
              github.com/wusheng0036/clean-refactor/issues
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
