import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Security & Safety - CleanRefactor AI",
  description: "Security and safe-use guidance for CleanRefactor AI.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security & Safety"
      description="Guidance for using CleanRefactor AI safely and reporting security concerns."
      updated="June 25, 2026"
      sections={[
        {
          title: "Sensitive code warning",
          body: (
            <p>Do not submit secrets, private keys, passwords, customer data, unreleased proprietary code, or regulated information unless you have confirmed that processing it through third-party AI providers is allowed.</p>
          ),
        },
        {
          title: "Security practices",
          body: (
            <p>The service uses HTTPS, Google OAuth for sign-in, PayPal for checkout, and server-side API calls for AI processing. Access checks are used before premium refactoring features are available.</p>
          ),
        },
        {
          title: "Responsible use",
          body: (
            <p>You may not use the service to create malware, evade security controls, exploit systems, violate licenses, or process code/data you are not authorized to use.</p>
          ),
        },
        {
          title: "AI safety limitations",
          body: (
            <p>AI output can introduce bugs or security weaknesses. Treat generated code as a draft and review it with tests, static analysis, dependency checks, and human engineering judgment.</p>
          ),
        },
        {
          title: "Reporting vulnerabilities",
          body: (
            <p>If you find a vulnerability or privacy issue, please report it through the GitHub issue tracker. Include clear reproduction steps and avoid posting live credentials or personal data.</p>
          ),
        },
      ]}
    />
  );
}
