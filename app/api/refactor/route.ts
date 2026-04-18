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
            content: `You are a senior software engineer specializing in code quality and production-ready code. Refactor the provided code to meet enterprise standards:

NAMING CONVENTIONS:
- Boolean variables: use is/has/should prefix (isActive, hasPermission, shouldRetry)
- Functions: use verb + noun (getUserById, calculateTotalPrice, validateInput)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_COUNT, DEFAULT_TIMEOUT)
- Classes/Types: PascalCase (UserProfile, PaymentService)

ERROR HANDLING:
- Validate all function inputs with descriptive error messages
- Use try-catch for async operations
- Include context in error messages (e.g., "Invalid userId 'abc': expected number")
- Never swallow errors silently

CODE QUALITY:
- Extract all magic numbers to named constants with comments
- Maximum 3 levels of nesting (refactor nested conditions)
- Single function: max 50 lines, single responsibility
- Use early returns to reduce nesting
- Prefer immutable operations (map/filter/reduce over for-loops)

TYPESCRIPT (if applicable):
- Add explicit return types
- Define interfaces for all objects
- Use type guards for runtime checks
- Avoid 'any' type

DOCUMENTATION:
- JSDoc for all public functions with @param and @returns
- Inline comments for complex business logic
- TODO comments for known issues

OUTPUT:
- Return ONLY the refactored code
- No explanations, no markdown code blocks
- Code must be production-ready and compile without errors`
          },
          {
            role: "user",
            content: `Refactor this code to production quality:\n\n${code}`
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
