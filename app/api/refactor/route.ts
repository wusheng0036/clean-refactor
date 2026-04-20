import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// SiliconFlow 配置
const SILICONFLOW_API_KEY = "sk-guqeqlonpyeeimztakfxnnztwwizbjhduabgggscbicjqyxz";
const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions";

// 智谱配置
const ZHIPU_API_KEY = "fc16254595884511b0db517f57ccb0f3.5AUQnLU217w7DIZy";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const REFACTOR_PROMPT = `You are a senior software engineer. Refactor code to production standards:

- Use const/let instead of var
- Convert callbacks to async/await
- Use arrow functions
- Add error handling
- Use descriptive names

Return ONLY the refactored code, no explanations.`;

const EXECUTION_TRACE_PROMPT = `Analyze JavaScript execution order. Be concise.

Output JSON only:
{
  "predictedOrder": ["start", "end", "promise", "timeout"],
  "keyInsight": "brief explanation"
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, model = 'siliconflow' } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const isTraceMode = isExecutionTraceCode(code);
    
    // 自动切换：执行顺序分析用智谱（更强），普通重构用硅基（更快）
    const useZhipu = isTraceMode || model === 'zhipu';
    
    if (useZhipu) {
      return await callZhipuAPI(code, isTraceMode);
    } else {
      return await callSiliconFlowAPI(code, isTraceMode);
    }
  } catch (err: any) {
    console.error("[Refactor API] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function callSiliconFlowAPI(code: string, isTraceMode: boolean) {
  const timeoutMs = isTraceMode ? 12000 : 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(SILICONFLOW_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SILICONFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V2.5",
      messages: [
        { role: "system", content: isTraceMode ? EXECUTION_TRACE_PROMPT : REFACTOR_PROMPT },
        { role: "user", content: isTraceMode ? `Analyze:\n${code}` : `Refactor:\n${code}` }
      ],
      temperature: 0.2,
      max_tokens: isTraceMode ? 500 : 1500,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SiliconFlow API error:", response.status, errorText);
    return NextResponse.json({ 
      error: "AI service error", 
      details: errorText 
    }, { status: 500 });
  }

  const data = await response.json();
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
      model: "siliconflow",
    });
  }

  return NextResponse.json({
    refactoredCode: content,
    mode: "refactor",
    model: "siliconflow",
  });
}

async function callZhipuAPI(code: string, isTraceMode: boolean) {
  const timeoutMs = isTraceMode ? 15000 : 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(ZHIPU_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: isTraceMode ? EXECUTION_TRACE_PROMPT : REFACTOR_PROMPT },
        { role: "user", content: isTraceMode ? `Analyze:\n${code}` : `Refactor:\n${code}` }
      ],
      temperature: 0.2,
      max_tokens: isTraceMode ? 500 : 1500,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zhipu API error:", response.status, errorText);
    return NextResponse.json({ 
      error: "AI service error", 
      details: errorText 
    }, { status: 500 });
  }

  const data = await response.json();
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
      model: "zhipu",
    });
  }

  return NextResponse.json({
    refactoredCode: content,
    mode: "refactor",
    model: "zhipu",
  });
}
