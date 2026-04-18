import { NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cleanrefactor-ai.vercel.app';
const PRICE = process.env.NEXT_PUBLIC_PRODUCT_PRICE || '14.99';

const PAYPAL_API = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

export async function POST() {
  try {
    console.log('PayPal API:', PAYPAL_API);
    console.log('Client ID exists:', !!PAYPAL_CLIENT_ID);
    console.log('Client Secret exists:', !!PAYPAL_SECRET);
    
    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('PayPal Token Error:', tokenRes.status, errorText);
      throw new Error(`Token Error: ${tokenRes.status}`);
    }
    const { access_token } = await tokenRes.json();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: PRICE,
          },
          description: 'CleanRefactor AI Lifetime License',
        }],
        application_context: {
          return_url: `${SITE_URL}/api/paypal/complete-payment`,
          cancel_url: `${SITE_URL}/?canceled=true`,
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const order = await orderRes.json();
    console.log('PayPal Order created:', order.id);
    const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      console.error('No approval URL in order:', order);
      throw new Error('No approval URL');
    }
    
    return NextResponse.json({ url: approvalUrl });
  } catch (err: any) {
    console.error('PayPal Create Order Error:', err.message);
    return NextResponse.json({ error: 'Pay Error', details: err.message }, { status: 500 });
  }
}