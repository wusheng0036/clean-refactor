import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const PAYMENT_API_URL = process.env.PAYMENT_API_URL || "https://cleanrefactor-payment-worker.donggua.workers.dev";

const REFACTOR_PROMPT = `You are a senior software engineer. Refactor code to production standards:

- Use const/let instead of var
- Convert callbacks to async/await
- Use arrow functions
- Add proper error handling
- Use descriptive variable names
- Add JSDoc comments

Return ONLY the refactored code, no explanations.`;

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check payment status
    const paymentRes = await fetch(`${PAYMENT_API_URL}/api/check-payment?email=${encodeURIComponent(token.email)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYMENT_API_SECRET || ''}`
      }
    });
    
    if (!paymentRes.ok) {
      return NextResponse.json({ error: "Payment required" }, { status: 403 });
    }
    
    const paymentData = await paymentRes.json();
    if (!paymentData.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 403 });
    }

    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Call OpenAI with streaming
    const openaiRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V2.5",
        messages: [
          { role: "system", content: REFACTOR_PROMPT },
          { role: "user", content: `Refactor this code:\n\n${code}` }
        ],
        temperature: 0.2,
        stream: true, // Enable streaming
      }),
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    // Return the stream directly to the client
    return new Response(openaiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error("[Refactor API] Error:", err);
    return NextResponse.json({ 
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}
