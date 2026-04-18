import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { activatePaid } from '../../user/status/route';

// 内存存储临时订单关联（与create-order共享）
declare global {
  var pendingOrders: Record<string, string> | undefined;
}

const pendingOrders = globalThis.pendingOrders || {};
if (!globalThis.pendingOrders) {
  globalThis.pendingOrders = pendingOrders;
}

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
  const pendingOrderId = searchParams.get('oid'); // 从创建订单时传递的ID

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
    console.log('PayPal capture data:', JSON.stringify(captureData, null, 2));
    console.log('Pending orders:', pendingOrders);
    console.log('Pending order ID from URL:', pendingOrderId);
    
    if (captureData.status === 'COMPLETED') {
      // 尝试多种方式获取用户邮箱
      const customId = captureData.purchase_units?.[0]?.custom_id;
      const emailFromPending = pendingOrderId ? pendingOrders[pendingOrderId] : null;
      const email = customId || emailFromPending;
      
      console.log('Custom ID from order:', customId);
      console.log('Email from pending orders:', emailFromPending);
      console.log('Final email to activate:', email);
      
      if (email) {
        // 激活付费状态（终身制，无限使用）
        const activated = await activatePaid(email);
        console.log('Activation result:', activated);
        
        // 清理pending订单
        if (pendingOrderId) {
          delete pendingOrders[pendingOrderId];
        }
        
        const licenseKey = generateLicenseKey();
        return NextResponse.redirect(`${SITE_URL}/?success=true&license=${licenseKey}&paid=true`);
      } else {
        // 无法获取邮箱，显示license key让用户手动激活
        console.log('No email found');
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