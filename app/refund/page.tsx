import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Refund Policy - CleanRefactor AI",
  description: "Refund policy for CleanRefactor AI paid access.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="This policy explains how refund requests are reviewed for CleanRefactor AI digital access purchases."
      updated="June 25, 2026"
      sections={[
        {
          title: "Digital product access",
          body: (
            <p>CleanRefactor AI sells digital access to software features. Access may be activated shortly after PayPal confirms payment.</p>
          ),
        },
        {
          title: "Refund window",
          body: (
            <p>Refund requests may be reviewed within 30 days of purchase when the service cannot be accessed, payment activation fails, or a duplicate charge occurs.</p>
          ),
        },
        {
          title: "When refunds may be declined",
          body: (
            <p>Refunds may be declined when access was successfully delivered and substantially used, when a request appears abusive, or when the issue is outside CleanRefactor AI's control.</p>
          ),
        },
        {
          title: "How to request a refund",
          body: (
            <p>Open a GitHub issue with your PayPal transaction date, order details, account email, and a short explanation. Do not include full payment card details or sensitive credentials.</p>
          ),
        },
        {
          title: "PayPal disputes",
          body: (
            <p>PayPal may provide additional buyer-protection or dispute-resolution options under its own policies. PayPal's decision may affect final refund handling.</p>
          ),
        },
      ]}
    />
  );
}
