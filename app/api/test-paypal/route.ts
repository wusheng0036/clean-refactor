import { NextResponse } from 'next/server';

// 硬编码沙箱凭证（测试阶段）
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AVL437-aKd1dRmJiPzj_qOfEiZP12GngINf54ml5BySCpTP2j54Z_L-wqj7fy601rag0yxOxa5UyvezR';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'ECOEhiHxxz85p1usKiHAyZR5yaR52BwNpT7vRNkgWNeYGqgwr8gfkM1Z5ySBQ9OiEvbdJQx06LuJfceX';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

export async function GET() {
  try {
    // 测试PayPal认证
    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    
    console.log('Testing PayPal auth...');
    console.log('Client ID length:', PAYPAL_CLIENT_ID?.length);
    console.log('Secret length:', PAYPAL_SECRET?.length);
    
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return NextResponse.json({
        success: false,
        status: tokenRes.status,
        error: errorText,
        clientIdPrefix: PAYPAL_CLIENT_ID?.substring(0, 10) + '...',
        secretPrefix: PAYPAL_SECRET?.substring(0, 5) + '...',
      }, { status: 500 });
    }

    const data = await tokenRes.json();
    return NextResponse.json({
      success: true,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      appId: data.app_id,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
