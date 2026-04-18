import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { addCredits } from '../../user/credits/route';
import { pendingOrders } from './create-order/route';

// 硬编码沙箱凭证（测试阶段）
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AVL437-aKd1dRmJiPzj_qOfEiZP12GngINf54ml5BySCpTP2j54Z_L-wqj7fy601rag0yxOxa5UyvezR';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'ECOEhiHxxz85p1usKiHAyZR5yaR52BwNpT7vRNkgWNeYGqgwr8gfkM1Z5ySBQ9OiEvbdJQx06LuJfceX';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cleanrefactor-ai.vercel.app';

const PAYPAL_API = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

function generateLicenseKey(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('token');

  if (!orderId) {
    return NextResponse.redirect(`${SITE_URL}/?error=true`);
  }

  try {
    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenRes.json();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();
    if (captureData.status === 'COMPLETED') {
      // 从订单中获取用户邮箱
      const orderId = captureData.id;
      const email = pendingOrders[orderId] || captureData.purchase_units?.[0]?.custom_id;
      
      if (email) {
        // 自动添加积分（10个积分）
        await addCredits(email, 10);
        // 清理pending订单
        delete pendingOrders[orderId];
        
        const licenseKey = generateLicenseKey();
        return NextResponse.redirect(`${SITE_URL}/?success=true&license=${licenseKey}&credits=10`);
      } else {
        // 无法获取邮箱，显示license key让用户手动激活
        const licenseKey = generateLicenseKey();
        return NextResponse.redirect(`${SITE_URL}/?success=true&license=${licenseKey}`);
      }
    } else {
      return NextResponse.redirect(`${SITE_URL}/?error=true`);
    }
  } catch (err) {
    return NextResponse.redirect(`${SITE_URL}/?error=true`);
  }
}