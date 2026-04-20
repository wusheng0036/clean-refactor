import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const REFACTOR_PROMPT = `You are a senior software engineer. Refactor code to production standards:

- Use const/let instead of var
- Convert callbacks to async/await
- Use arrow functions
- Add proper error handling
- Use descriptive variable names

Return ONLY the refactored code, no explanations.`;

// Use Node.js runtime with extended timeout (requires Vercel Pro or config)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log("[Refactor API] Starting...");
    
    const session = await auth();
    console.log("[Refactor API] Session:", session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    console.log("[Refactor API] Code length:", code?.length);
    
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      console.error("[Refactor API] Missing OPENAI_API_KEY");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    console.log("[Refactor API] Calling OpenAI...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
    
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
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log("[Refactor API] OpenAI status:", openaiRes.status);

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("[Refactor API] OpenAI error:", errorText);
      return NextResponse.json({ 
        error: "AI service error", 
        details: errorText 
      }, { status: 500 });
    }

    const data = await openaiRes.json();
    const refactoredCode = data.choices?.[0]?.message?.content || "";
    
    console.log("[Refactor API] Success, length:", refactoredCode.length);

    return NextResponse.json({
      refactoredCode,
      mode: "refactor",
    });
  } catch (err: any) {
    console.error("[Refactor API] Error:", err);
    if (err.name === 'AbortError') {
      return NextResponse.json({ 
        error: "Request timeout - AI took too long to respond" 
      }, { status: 504 });
    }
    return NextResponse.json({ 
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}
