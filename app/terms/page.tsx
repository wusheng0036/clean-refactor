import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of Service - CleanRefactor AI",
  description: "Terms for using CleanRefactor AI.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These terms describe the rules for accessing and using CleanRefactor AI, a small AI code refactoring practice project."
      updated="June 25, 2026"
      sections={[
        {
          title: "Service overview",
          body: (
            <p>CleanRefactor AI provides AI-assisted code refactoring and JavaScript execution-order analysis. The service is provided as-is and may change, be interrupted, or be discontinued.</p>
          ),
        },
        {
          title: "User responsibilities",
          body: (
            <>
              <p>You are responsible for the code you submit and must have the rights and permissions needed to process it through the service.</p>
              <p>You must not submit malware, illegal content, private credentials, API keys, passwords, or data that violates another person's rights.</p>
            </>
          ),
        },
        {
          title: "Accounts and access",
          body: (
            <p>Some features require Google sign-in and paid access. You are responsible for keeping your account secure and for any activity under your account.</p>
          ),
        },
        {
          title: "Payments",
          body: (
            <p>Payments are handled by PayPal. Prices, access terms, and promotional offers may change. Payment completion may be required before premium features are enabled.</p>
          ),
        },
        {
          title: "AI output",
          body: (
            <p>AI-generated refactoring suggestions may be incomplete, incorrect, insecure, or unsuitable for your project. Review, test, and validate all output before using it in production.</p>
          ),
        },
        {
          title: "Limitation of liability",
          body: (
            <p>To the maximum extent permitted by law, CleanRefactor AI is not liable for indirect, incidental, special, consequential, or business losses arising from use of the service.</p>
          ),
        },
      ]}
    />
  );
}
