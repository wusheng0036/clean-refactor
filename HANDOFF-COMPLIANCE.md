# CleanRefactor AI Handoff

## Project

- Site: https://cleanrefactor-ai.vercel.app/
- Repository: https://github.com/wusheng0036/clean-refactor
- Platform: Vercel
- Framework: Next.js App Router, React 19, NextAuth v5 beta, Prisma SQLite schema
- Product: AI code refactoring and JavaScript execution-order analysis

## Current Data Flow

1. Visitors open the landing page and can sign in with Google OAuth.
2. Authenticated users can start the PayPal checkout for a lifetime license.
3. PayPal returns payment status to the app and the app activates paid access for the user email.
4. Paid users submit code to `/api/refactor`.
5. The server sends submitted code to configured AI providers for refactoring or execution-order analysis.

## Third-Party Services

- Vercel: hosting and serverless runtime.
- Google OAuth: sign-in provider.
- PayPal: checkout and payment confirmation.
- AI providers: SiliconFlow and Zhipu, configured by environment variables.
- Database: Prisma schema currently targets SQLite via `DATABASE_URL`.

## Required Environment Variables

See `env.example` for the complete template.

- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` / `AUTH_SECRET`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_MODE`
- `NEXT_PUBLIC_PRODUCT_PRICE`
- `SILICONFLOW_API_KEY`
- `ZHIPU_API_KEY`

Do not commit real secrets. The code now requires PayPal and AI keys from environment variables instead of falling back to public hardcoded credentials.

## Compliance Pages Added

- `/privacy`: account, payment, submitted-code, provider, retention, and user-choice disclosures.
- `/terms`: service rules, acceptable use, account/payment terms, AI output disclaimer, liability limit.
- `/security`: sensitive-code warning, safe use, security practices, vulnerability reporting.
- `/refund`: 30-day refund review baseline for digital access, PayPal dispute note.

The landing page footer links all legal pages. The pricing/checkout area links refund, terms, and privacy pages near the PayPal payment button.

## Contact Method

The site has no dedicated support email. Public-facing pages direct users to the GitHub issue tracker:

https://github.com/wusheng0036/clean-refactor/issues

If a real support inbox is created later, update `app/legal-page.tsx` and the policy wording.

## Vercel Access Notes

- Do not commit Vercel tokens or other deployment credentials to this repository.
- If automation needs Vercel access, store the token outside git, for example in a password manager or a local-only shell profile as `VERCEL_TOKEN`.
- The current project is hosted under the Vercel account/team `yongdong0889-2744s-projects` and project name `cleanrefactor-ai`.
- To inspect or deploy with the CLI, use `npx vercel inspect https://cleanrefactor-ai.vercel.app --token "$VERCEL_TOKEN"` or `npx vercel --prod --token "$VERCEL_TOKEN"` after confirming project linkage.
- Rotate or revoke temporary Vercel tokens after maintenance work is complete.

## Security Notes

- Basic security headers are configured in `next.config.ts` for Vercel.
- `public/_headers` is also present as a portable static-hosting fallback.
- The app should avoid collecting secrets or confidential code. The legal pages warn users not to submit sensitive code or credentials.
- Previously exposed credentials in repository history should be rotated in the relevant provider dashboards.
- The GitHub and Vercel tokens shared during maintenance were temporary operational credentials and should not be stored in source control.

## Recommended Follow-Up

1. Rotate any PayPal, SiliconFlow, or Zhipu keys that were previously committed to git history.
2. Confirm production Vercel environment variables are set before redeploying.
3. Consider replacing in-memory PayPal pending order storage with database-backed order records.
4. Consider adding a real support contact email before monetizing beyond practice use.
