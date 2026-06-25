import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy - CleanRefactor AI",
  description: "How CleanRefactor AI handles account, payment, and code processing data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains what data CleanRefactor AI collects, how the service uses it, and the choices available to users."
      updated="June 25, 2026"
      sections={[
        {
          title: "Information we collect",
          body: (
            <>
              <p>When you sign in, we receive basic Google account information such as your email address and profile identifier through Google OAuth.</p>
              <p>When you purchase access, PayPal processes payment details. CleanRefactor AI receives payment status and order-related information needed to activate your account.</p>
              <p>When you use the refactoring tool, the code you submit is sent to AI service providers only to generate the requested output.</p>
            </>
          ),
        },
        {
          title: "How we use information",
          body: (
            <>
              <p>We use account information to authenticate users, manage paid access, prevent abuse, and provide the refactoring service.</p>
              <p>Submitted code is used to produce refactoring or execution-order analysis responses. Do not submit secrets, private keys, passwords, or confidential code you are not permitted to share.</p>
            </>
          ),
        },
        {
          title: "Third-party services",
          body: (
            <p>CleanRefactor AI may rely on Vercel hosting, Google OAuth, PayPal checkout, database providers, and AI API providers such as SiliconFlow or Zhipu. These providers process data under their own policies.</p>
          ),
        },
        {
          title: "Retention and deletion",
          body: (
            <p>Account and payment activation records may be retained while your account remains active and as needed for security, support, accounting, or legal reasons. The application is designed for lightweight practice use and does not intentionally store submitted source code as a product feature.</p>
          ),
        },
        {
          title: "Your choices",
          body: (
            <p>You can stop using the service at any time. To request account deletion, payment-access review, or data questions, contact us through the GitHub issue tracker linked below.</p>
          ),
        },
      ]}
    />
  );
}
