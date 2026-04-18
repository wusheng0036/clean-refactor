import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deductCredit } from "../user/credits/route";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const REFACTOR_PROMPT = `You are a senior software engineer and security expert. Refactor code to enterprise production standards with ZERO security vulnerabilities.

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
- Return object field names MUST be semantically accurate (e.g., completedOrders not orders)
- Constants: UPPER_SNAKE_CASE (ORDER_STATUS_COMPLETED)
- Extract ALL magic numbers to named constants

ERROR HANDLING:
- Validate ALL inputs at function entry
- Throw descriptive errors with context
- Use Error Cause when re-throwing: throw new Error('message', { cause: error })
- Wrap async operations in try-catch blocks
- Never swallow errors silently

CODE STRUCTURE:
- Maximum 2 levels of nesting (extract to helper functions)
- Single function: max 40 lines
- Pure functions preferred (no side effects)
- Use functional methods: map/filter/reduce instead of for-loops

FINANCIAL CALCULATIONS:
- Use integer cents (e.g., 100 = $1.00) OR specify precision handling
- Avoid floating point arithmetic for money

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

const ANALYZE_PROMPT = `You are a senior code reviewer. Analyze the refactoring and provide a detailed report in JSON format.

Analyze:
1. Security improvements (SQL injection, XSS, input validation)
2. Code quality improvements (naming, structure, async patterns)
3. Error handling improvements
4. Performance considerations
5. Further optimization suggestions

Output STRICT JSON format:
{
  "summary": "Brief overall assessment",
  "improvements": [
    { "category": "Security|Quality|Performance", "before": "original issue", "after": "how fixed" }
  ],
  "suggestions": [
    { "priority": "high|medium|low", "issue": "what could be better", "recommendation": "specific fix" }
  ],
  "score": { "before": 1-10, "after": 1-10 }
}`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, includeAnalysis = false } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const deducted = await deductCredit(session.user.email);
    if (!deducted) {
      return NextResponse.json({ error: "No credits remaining" }, { status: 403 });
    }

    // Step 1: Refactor code
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
          { role: "user", content: `Refactor this code to production quality:\n\n${code}` }
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

    // Step 2: Analysis (optional, only if requested)
    let analysis = null;
    if (includeAnalysis) {
      const analyzeRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V2.5",
          messages: [
            { role: "system", content: ANALYZE_PROMPT },
            { 
              role: "user", 
              content: `Original code:\n${code}\n\nRefactored code:\n${refactoredCode}\n\nProvide analysis in JSON format.` 
            }
          ],
          temperature: 0.3,
        }),
      });

      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        const analysisText = analyzeData.choices?.[0]?.message?.content || "";
        try {
          // Extract JSON from response
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
          console.error("Failed to parse analysis:", e);
        }
      }
    }

    return NextResponse.json({
      refactoredCode,
      analysis,
      model: refactorData.model,
      usage: refactorData.usage,
    });
  } catch (err: any) {
    console.error("Refactor error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
