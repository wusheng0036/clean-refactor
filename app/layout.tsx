import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "CleanRefactor AI - Smart Code Refactoring Tool",
  description: "Transform messy code into clean, maintainable masterpieces with AI. Support JavaScript, TypeScript, and execution order analysis.",
  keywords: ["code refactoring", "AI code tool", "JavaScript", "TypeScript", "clean code", "developer tools"],
  authors: [{ name: "CleanRefactor AI" }],
  creator: "CleanRefactor AI",
  publisher: "CleanRefactor AI",
  robots: "index, follow",
  alternates: {
    canonical: "https://cleanrefactor-ai.vercel.app",
  },
  openGraph: {
    title: "CleanRefactor AI - Smart Code Refactoring Tool",
    description: "Transform messy code into clean, maintainable masterpieces with AI. Support JavaScript, TypeScript, and execution order analysis.",
    url: "https://cleanrefactor-ai.vercel.app",
    siteName: "CleanRefactor AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cleanrefactor-ai.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "CleanRefactor AI - Smart Code Refactoring Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanRefactor AI - Smart Code Refactoring Tool",
    description: "Transform messy code into clean, maintainable masterpieces with AI.",
    images: ["https://cleanrefactor-ai.vercel.app/og-image.png"],
    creator: "@cleanrefactor",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CleanRefactor AI",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "14.99",
                priceCurrency: "USD",
                priceValidUntil: "2026-12-31",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "128",
              },
              description: "AI-powered code refactoring tool that transforms messy code into clean, maintainable masterpieces.",
              url: "https://cleanrefactor-ai.vercel.app",
              image: "https://cleanrefactor-ai.vercel.app/og-image.png",
              author: {
                "@type": "Organization",
                name: "CleanRefactor AI",
              },
            }),
          }}
        />
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CleanRefactor AI",
              url: "https://cleanrefactor-ai.vercel.app",
              logo: "https://cleanrefactor-ai.vercel.app/logo.png",
              sameAs: [
                "https://twitter.com/cleanrefactor",
                "https://github.com/cleanrefactor",
              ],
            }),
          }}
        />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}