import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePaid } from "../user/status/route";

// 手动激活付费状态（用于测试或支付回调失败时）
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 激活当前登录用户
    await activatePaid(session.user.email);
    
    return NextResponse.json({
      success: true,
      message: "Activated! You now have lifetime access.",
      email: session.user.email,
    });
  } catch (err: any) {
    console.error("Activate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
