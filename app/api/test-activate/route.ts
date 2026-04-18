import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePaid } from "../user/status/route";

// 测试用：手动激活付费状态
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 仅允许特定测试账号
    const allowedEmails = ['wusheng0036@gmail.com']; // 添加你的测试邮箱
    
    if (!allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await activatePaid(session.user.email);
    
    return NextResponse.json({
      success: true,
      message: "Activated for testing!",
      email: session.user.email,
    });
  } catch (err: any) {
    console.error("Manual activate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
