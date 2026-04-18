import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePaid, checkAccess } from "../user/status/route";

// 直接激活（带详细调试信息）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    // 检查当前状态
    const beforeStatus = await checkAccess(email);
    
    // 尝试激活
    const success = await activatePaid(email);
    
    // 检查激活后状态
    const afterStatus = await checkAccess(email);
    
    return NextResponse.json({
      success: success,
      email: email,
      beforeStatus: beforeStatus,
      afterStatus: afterStatus,
      message: success ? "Activated successfully!" : "Activation failed",
    });
  } catch (err: any) {
    console.error("Direct activate error:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}

// POST方式激活
export async function POST() {
  return GET();
}
