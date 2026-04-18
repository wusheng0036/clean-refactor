import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cleanrefactor-ai.vercel.app';

const PAYPAL_API = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

function generateLicenseKey(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('token');

  if (!orderId) {
    return NextResponse.redirect(`${SITE_URL}/?error=true`);
  }

  try {
    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenRes.json();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();
    if (captureData.status === 'COMPLETED') {
      const licenseKey = generateLicenseKey();
      return NextResponse.redirect(`${SITE_URL}/?success=true&license=${licenseKey}`);
    } else {
      return NextResponse.redirect(`${SITE_URL}/?error=true`);
    }
  } catch (err) {
    return NextResponse.redirect(`${SITE_URL}/?error=true`);
  }
}