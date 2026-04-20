import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkAccess } from "../user/status/route";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";

// 智谱 AI GLM-5.1 模型
const MODEL = "glm-5.1";

const REFACTOR_PROMPT = `You are a senior software engineer. Refactor code to production standards:

- Use const/let instead of var
- Convert callbacks to async/await
- Use arrow functions
- Add error handling
- Use descriptive names

Return ONLY the refactored code, no explanations.`;

// 检测是否是执行顺序分析类代码
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

const EXECUTION_TRACE_PROMPT = `You are a JavaScript event loop expert. Analyze the code and predict the EXACT execution order.

Output JSON:
{
  "predictedOrder": ["1", "2", "3", "4"],
  "keyInsight": "explanation"
}`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // 检查用户是否已付费
    const hasAccess = await checkAccess(session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ error: "Payment required" }, { status: 403 });
    }

    const isTraceMode = isExecutionTraceCode(code);
    
    // GPT-3.5 is fast, use shorter timeout
    const timeoutMs = isTraceMode ? 8000 : 10000;

    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const openaiRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: isTraceMode ? EXECUTION_TRACE_PROMPT : REFACTOR_PROMPT },
          { role: "user", content: isTraceMode ? `Analyze:\n${code}` : `Refactor:\n${code}` }
        ],
        temperature: 0.2,
        max_tokens: isTraceMode ? 1000 : 2000, // 执行分析用较少token
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", openaiRes.status, errorText);
      return NextResponse.json({ 
        error: "AI service error", 
        details: errorText,
        status: openaiRes.status 
      }, { status: 500 });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (isTraceMode) {
      let executionTrace = null;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
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

    return NextResponse.json({
      refactoredCode: content,
      mode: "refactor",
    });
  } catch (err: any) {
    console.error("[Refactor API] Error:", err);
    if (err.name === 'AbortError') {
      return NextResponse.json({ 
        error: "Request timeout - AI is taking too long. Please try again." 
      }, { status: 504 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
