import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    paypalClientIdExists: !!process.env.PAYPAL_CLIENT_ID,
    paypalSecretExists: !!process.env.PAYPAL_CLIENT_SECRET,
    paypalMode: process.env.PAYPAL_MODE || 'not set (default: sandbox)',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
  });
}
