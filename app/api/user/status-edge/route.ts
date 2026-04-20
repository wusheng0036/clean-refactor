import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PAYMENT_API_URL = process.env.PAYMENT_API_URL || "https://cleanrefactor-payment-worker.donggua.workers.dev";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check payment status from Cloudflare Worker
    const res = await fetch(`${PAYMENT_API_URL}/api/check-payment?email=${encodeURIComponent(token.email)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYMENT_API_SECRET || ''}`
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ isPaid: false });
    }
    
    const data = await res.json();
    return NextResponse.json({ isPaid: data.paid === true });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json({ isPaid: false });
  }
}
