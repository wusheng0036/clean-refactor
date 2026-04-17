import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API not configured" }, { status: 500 });
    }

    console.log("Testing OpenAI API...");
    console.log("Base URL:", baseUrl);
    console.log("API Key exists:", apiKey ? "Yes (masked)" : "No");

    // 调用 OpenAI API
    const requestBody = {
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      messages: [
        {
          role: "system",
          content: "You are an expert code refactoring assistant. Your task is to analyze the provided code and return an improved version that is cleaner, more efficient, and follows best practices. Preserve the original functionality. Return only the refactored code without explanations."
        },
        {
          role: "user",
          content: `Please refactor this code:\n\n${code}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: new TextEncoder().encode(JSON.stringify(requestBody)),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("OpenAI API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "AI refactoring failed", details: data },
        { status: 500 }
      );
    }

    const refactoredCode = data.choices?.[0]?.message?.content || "No output";

    return NextResponse.json({ 
      success: true,
      refactoredCode,
      model: data.model,
      usage: data.usage
    });
  } catch (error: any) {
    console.error("Test refactor error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refactor code" },
      { status: 500 }
    );
  }
}
