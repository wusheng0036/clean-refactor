import { NextResponse } from "next/server";
import { addCredits } from "../user/credits/route";

// 内存存储激活码（测试阶段）
const licenseKeys: Record<string, { credits: number; used: boolean }> = {};

// 生成激活码（内部使用，测试阶段手动调用）
export async function generateLicenseKey(credits: number = 10): Promise<string> {
  const key = Math.random().toString(36).substring(2, 15).toUpperCase();
  licenseKeys[key] = { credits, used: false };
  return key;
}

export async function POST(req: Request) {
  try {
    const { licenseKey, email } = await req.json();
    
    if (!licenseKey || !email) {
      return NextResponse.json({ error: "License key and email required" }, { status: 400 });
    }

    const license = licenseKeys[licenseKey.toUpperCase()];
    
    if (!license) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 400 });
    }
    
    if (license.used) {
      return NextResponse.json({ error: "License key already used" }, { status: 400 });
    }

    // 添加积分
    await addCredits(email, license.credits);
    license.used = true;

    return NextResponse.json({
      success: true,
      credits: license.credits,
      message: `Activated! Added ${license.credits} credits.`,
    });
  } catch (err: any) {
    console.error("License activation error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// 获取测试激活码（仅开发测试用）
export async function GET() {
  // 生成测试激活码
  const testKey = await generateLicenseKey(10);
  return NextResponse.json({
    testKey,
    note: "This is a test license key with 10 credits. Use it in the activation form.",
  });
}
