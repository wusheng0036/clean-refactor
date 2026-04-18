import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserByEmail, createUser, updateUserPaidStatus } from "@/lib/d1";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    // 从D1获取用户
    let user = await getUserByEmail(email);
    
    // 如果用户不存在，创建新用户
    if (!user) {
      const userId = crypto.randomUUID();
      await createUser({
        id: userId,
        email: email,
        name: session.user.name || undefined,
        provider: 'google',
      });
      user = await getUserByEmail(email);
    }

    return NextResponse.json({
      isPaid: user?.is_paid === 1 || user?.is_paid === true,
      email: email,
    });
  } catch (err) {
    console.error("Get user status error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 激活付费（支付后使用）
export async function activatePaid(email: string): Promise<boolean> {
  try {
    console.log("Activating user:", email);
    let user = await getUserByEmail(email);
    console.log("Found user:", user);
    
    if (!user) {
      // 用户不存在，创建新用户
      console.log("Creating new user...");
      const userId = crypto.randomUUID();
      const createResult = await createUser({
        id: userId,
        email: email,
        name: null,
        provider: 'google',
      });
      console.log("Create user result:", createResult);
      
      // 重新获取用户
      user = await getUserByEmail(email);
      console.log("User after creation:", user);
    }
    
    if (user) {
      const updateResult = await updateUserPaidStatus(user.id, true);
      console.log("Update paid status result:", updateResult);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Activate paid error:", err);
    return false;
  }
}

// 检查用户是否有权限使用（内部使用）
export async function checkAccess(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    return user?.is_paid === 1 || user?.is_paid === true;
  } catch (err) {
    console.error("Check access error:", err);
    return false;
  }
}

// 检查用户是否已付费（内部使用）
export async function isUserPaid(email: string): Promise<boolean> {
  return checkAccess(email);
}
