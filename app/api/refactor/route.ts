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

const EXECUTION_TRACE_PROMPT = `You are a JavaScript event loop expert. Analyze the code and predict the EXACT execution order of console.log statements.

Output format:
{
  "predictedOrder": ["1", "2", "3", "4"],
  "keyInsight": "explanation"
}`;

function isExecutionTraceCode(code: string): boolean {
  if (/输出顺序|执行顺序|predictedOrder|event loop|微任务|宏任务/i.test(code)) {
    return true;
  }
  const patterns = [
    /console\.log\s*\(/g,
    /setTimeout\s*\(/g,
    /Promise\.(resolve|reject)/g,
    /async\s+function/g,
    /await\s+/g,
  ];
  const matches = patterns.filter(p => p.test(code)).length;
  return matches >= 3;
}

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log("[Refactor API Edge] Starting request...");
    
    // Verify JWT token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("[Refactor API] Token:", token?.email);
    
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
      return NextResponse.json({ error: "Payment required. Please purchase to continue." }, { status: 403 });
    }

    const { code } = await req.json();
    console.log("[Refactor API] Code length:", code?.length);
    
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const isTraceMode = isExecutionTraceCode(code);
    console.log('[Refactor API] isTraceMode:', isTraceMode);

    if (isTraceMode) {
      const traceRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V2.5",
          messages: [
            { role: "system", content: EXECUTION_TRACE_PROMPT },
            { role: "user", content: `Analyze this code execution order:\n\n${code}` }
          ],
          temperature: 0.2,
        }),
      });

      if (!traceRes.ok) {
        const errorData = await traceRes.json();
        console.error("OpenAI API error:", errorData);
        return NextResponse.json({ error: "AI service error" }, { status: 500 });
      }

      const traceData = await traceRes.json();
      const traceText = traceData.choices?.[0]?.message?.content || "";
      
      let executionTrace = null;
      try {
        const jsonMatch = traceText.match(/\{[\s\S]*\}/);
        executionTrace = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error("Failed to parse execution trace:", e);
      }

      return NextResponse.json({
        refactoredCode: code,
        executionTrace,
        mode: "execution-trace",
      });
    }

    // Refactor code
    const refactorRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
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
      }),
    });

    if (!refactorRes.ok) {
      const errorData = await refactorRes.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const refactorData = await refactorRes.json();
    const refactoredCode = refactorData.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      refactoredCode,
      mode: "refactor",
    });
  } catch (err: any) {
    console.error("[Refactor API] Error:", err);
    return NextResponse.json({ 
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}
