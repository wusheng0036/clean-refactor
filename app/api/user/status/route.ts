import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 内存存储用户付费状态（测试阶段）
const userStatus: Record<string, { isPaid: boolean }> = {};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    // 初始化用户（未付费）
    if (!userStatus[email]) {
      userStatus[email] = {
        isPaid: false,
      };
    }

    return NextResponse.json({
      isPaid: userStatus[email].isPaid,
      email: email,
    });
  } catch (err) {
    console.error("Get user status error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 检查用户是否有权限使用（内部使用）
export async function checkAccess(email: string): Promise<boolean> {
  return userStatus[email]?.isPaid || false;
}

// 激活付费（支付后使用）
export async function activatePaid(email: string): Promise<void> {
  if (!userStatus[email]) {
    userStatus[email] = { isPaid: false };
  }
  userStatus[email].isPaid = true;
}

// 检查用户是否已付费（内部使用）
export async function isUserPaid(email: string): Promise<boolean> {
  return userStatus[email]?.isPaid || false;
}
