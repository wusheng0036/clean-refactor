import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { updateUserPaidStatus, updateOrderStatus } from "@/lib/d1";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cleanrefactor-ai.vercel.app';

const PAYPAL_API = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get PayPal access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to get PayPal token');
    }

    const { access_token } = await tokenRes.json();

    // Capture the order
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();

    if (captureData.status === 'COMPLETED') {
      // Update user paid status in database
      // Note: This requires user ID mapping, currently using email
      // TODO: Implement proper user ID tracking
      
      return NextResponse.json({ 
        success: true, 
        status: 'COMPLETED',
        orderId: captureData.id 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        status: captureData.status,
        error: 'Payment not completed' 
      }, { status: 400 });
    }
  } catch (err) {
    console.error('Capture order error:', err);
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
  }
}
