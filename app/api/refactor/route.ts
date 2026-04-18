import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deductCredit } from "../user/credits/route";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export async function POST(req: Request) {
  try {
    // 检查登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // 扣除积分
    const deducted = await deductCredit(session.user.email);
    if (!deducted) {
      return NextResponse.json({ error: "No credits remaining" }, { status: 403 });
    }

    // 调用 AI API
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V2.5",
        messages: [
          {
            role: "system",
            content: "You are an expert code refactoring assistant. Your task is to improve the provided code by: 1) Using modern JavaScript/TypeScript features, 2) Improving variable and function names, 3) Adding proper error handling, 4) Following best practices, 5) Adding JSDoc comments. Return only the refactored code without explanations."
          },
          {
            role: "user",
            content: `Please refactor this code:\n\n${code}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await res.json();
    const refactoredCode = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      refactoredCode,
      model: data.model,
      usage: data.usage,
    });
  } catch (err: any) {
    console.error("Refactor error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
