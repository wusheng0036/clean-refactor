import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

    // 测试硅基流动 API
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    console.log("Testing API with key:", OPENAI_API_KEY?.slice(0, 10) + "...");
    console.log("Base URL:", OPENAI_BASE_URL);

    const testRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V2.5",
        messages: [
          { role: "system", content: "You are a code refactoring assistant." },
          { role: "user", content: `Refactor this code:\n\n${code.slice(0, 500)}` }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    console.log("API Response status:", testRes.status);

    if (!testRes.ok) {
      const errorData = await testRes.json();
      console.error("API Error:", errorData);
      return NextResponse.json({ 
        error: "AI service error", 
        details: errorData,
        status: testRes.status 
      }, { status: 500 });
    }

    const data = await testRes.json();
    console.log("API Success, tokens used:", data.usage);

    return NextResponse.json({
      refactoredCode: data.choices?.[0]?.message?.content || "No response",
      model: data.model,
      usage: data.usage,
    });

  } catch (err: any) {
    console.error("Test refactor error:", err);
    return NextResponse.json({ 
      error: err.message || "Server error",
      stack: err.stack 
    }, { status: 500 });
  }
}
