import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 硬编码硅基流动配置（测试用）
const OPENAI_API_KEY = "sk-guqeqlonpyeeimztakfxnnztwwizbjhduabgggscbicjqyxz";
const OPENAI_BASE_URL = "https://api.siliconflow.cn/v1";
// 试试 DeepSeek 今天速度如何
const MODEL = "deepseek-ai/DeepSeek-V2.5";

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

const EXECUTION_TRACE_PROMPT = `Analyze JavaScript execution order. Be concise.

Output JSON only:
{
  "predictedOrder": ["start", "end", "promise", "timeout"],
  "keyInsight": "brief explanation"
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

    // 检查用户是否已付费 - 临时跳过，测试 auth
    // const hasAccess = await checkAccess(session.user.email);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: "Payment required" }, { status: 403 });
    // }

    const isTraceMode = isExecutionTraceCode(code);
    
    // Execution trace needs more time for complex analysis
    const timeoutMs = isTraceMode ? 12000 : 8000;

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
        max_tokens: isTraceMode ? 500 : 1500, // 执行分析用更少token
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
