import { NextResponse } from "next/server";
import { queryD1, getUserByEmail, createUser, updateUserPaidStatus } from "@/lib/d1";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email || "test@example.com";
    
    const results: any = {
      timestamp: new Date().toISOString(),
      email,
      env: {
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "✓ Set" : "✗ Missing",
        D1_DATABASE_ID: process.env.D1_DATABASE_ID ? "✓ Set" : "✗ Missing",
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN ? "✓ Set" : "✗ Missing",
      },
      steps: [],
    };

    // Step 1: Test D1 connection with a simple query
    results.steps.push({ step: 1, action: "Test D1 connection" });
    const testQuery = await queryD1("SELECT 1 as test");
    results.steps[0].result = testQuery;
    
    if (!testQuery.success) {
      results.error = "D1 connection failed";
      return NextResponse.json(results, { status: 500 });
    }

    // Step 2: Check if users table exists
    results.steps.push({ step: 2, action: "Check users table" });
    const tableCheck = await queryD1("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    results.steps[1].result = tableCheck;
    
    if (!tableCheck.success || !tableCheck.results?.length) {
      results.error = "Users table does not exist";
      return NextResponse.json(results, { status: 500 });
    }

    // Step 3: Get user by email
    results.steps.push({ step: 3, action: "Get user by email", email });
    const user = await getUserByEmail(email);
    results.steps[2].result = { userFound: !!user, user };

    // Step 4: If no user, create one
    if (!user) {
      results.steps.push({ step: 4, action: "Create new user", email });
      const userId = crypto.randomUUID();
      const createResult = await createUser({
        id: userId,
        email: email,
        name: "Test User",
        provider: "google",
      });
      results.steps[3].result = createResult;
      
      if (!createResult.success) {
        results.error = "Failed to create user";
        return NextResponse.json(results, { status: 500 });
      }
      
      // Re-fetch user
      const newUser = await getUserByEmail(email);
      results.steps.push({ step: 5, action: "Re-fetch user after creation", user: newUser });
      
      if (newUser) {
        // Try to update paid status
        const updateResult = await updateUserPaidStatus(newUser.id, true);
        results.steps.push({ step: 6, action: "Update paid status", result: updateResult });
        
        // Final check
        const finalUser = await getUserByEmail(email);
        results.steps.push({ step: 7, action: "Final user check", user: finalUser });
      }
    } else {
      // User exists, try to update
      results.steps.push({ step: 4, action: "Update existing user paid status", userId: user.id });
      const updateResult = await updateUserPaidStatus(user.id, true);
      results.steps[3].result = updateResult;
      
      // Final check
      const finalUser = await getUserByEmail(email);
      results.steps.push({ step: 5, action: "Final user check", user: finalUser });
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}
