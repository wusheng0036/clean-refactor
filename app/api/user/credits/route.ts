import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/d1";

// 内存存储用户积分（测试阶段）
const userCredits: Record<string, { credits: number; isPaid: boolean; hasUsedFreeTrial: boolean }> = {};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    // 初始化用户积分（首次访问）
    if (!userCredits[email]) {
      userCredits[email] = {
        credits: 3, // 免费试用3次
        isPaid: false,
        hasUsedFreeTrial: false,
      };
    }

    return NextResponse.json({
      credits: userCredits[email].credits,
      isPaid: userCredits[email].isPaid,
      email: email,
    });
  } catch (err) {
    console.error("Get credits error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 扣除积分（内部使用）
export async function deductCredit(email: string): Promise<boolean> {
  if (userCredits[email] && userCredits[email].credits > 0) {
    userCredits[email].credits--;
    return true;
  }
  return false;
}

// 激活付费（内部使用）
export async function activatePaid(email: string): Promise<void> {
  if (userCredits[email]) {
    userCredits[email].isPaid = true;
  }
}
