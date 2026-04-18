import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deductCredit } from "../user/credits/route";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const SYSTEM_PROMPT = `You are a senior software engineer and security expert. Refactor code to enterprise production standards with ZERO security vulnerabilities.

SECURITY (CRITICAL - NEVER SKIP):
- SQL queries MUST use parameterized queries (? placeholders) - NEVER string concatenation
- Sanitize all user inputs before processing
- Escape output to prevent XSS
- Validate all external data with strict type checking

MODERN JAVASCRIPT/TYPESCRIPT:
- Convert ALL callbacks to async/await with Promise
- Use const/let instead of var
- Prefer arrow functions for callbacks
- Use destructuring and spread operators
- Use optional chaining (?.) and nullish coalescing (??)

NAMING CONVENTIONS:
- Boolean: is/has/should prefix (isActive, hasPermission)
- Functions: verb + noun (getUserById, calculateTotalPrice)
- Constants: UPPER_SNAKE_CASE (ORDER_STATUS_COMPLETED)
- Extract ALL magic numbers to named constants

ERROR HANDLING:
- Validate ALL inputs at function entry
- Throw descriptive errors with context
- Wrap async operations in try-catch blocks
- Never swallow errors silently

CODE STRUCTURE:
- Maximum 2 levels of nesting (extract to helper functions)
- Single function: max 40 lines
- Pure functions preferred (no side effects)
- Use functional methods: map/filter/reduce instead of for-loops

DATABASE:
- ALWAYS use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [userId])
- NEVER use string concatenation for SQL
- Handle connection errors gracefully

DOCUMENTATION:
- JSDoc with @param types, @returns, @throws
- Document security considerations
- TODO for incomplete implementations

OUTPUT:
- Return ONLY the refactored code
- No markdown code blocks, no explanations
- Code must be secure, modern, and production-ready`;

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
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `Refactor this code to production quality:\n\n${code}`
          }
        ],
        temperature: 0.2,
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
