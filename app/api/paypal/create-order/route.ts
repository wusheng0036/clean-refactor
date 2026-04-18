import { NextResponse } from 'next/server';

// 硬编码沙箱凭证（测试阶段）
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AVL437-aKd1dRmJiPzj_qOfEiZP12GngINf54ml5BySCpTP2j54Z_L-wqj7fy601rag0yxOxa5UyvezR';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'ECOEhiHxxz85p1usKiHAyZR5yaR52BwNpT7vRNkgWNeYGqgwr8gfkM1Z5ySBQ9OiEvbdJQx06LuJfceX';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cleanrefactor-ai.vercel.app';
const PRICE = process.env.NEXT_PUBLIC_PRODUCT_PRICE || '14.99';

const PAYPAL_API = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// 内存存储临时订单关联（生产环境应使用Redis或数据库）
const pendingOrders: Record<string, string> = {};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
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
      console.error('PayPal Token Error:', tokenRes.status, errorText);
      throw new Error(`Token Error: ${tokenRes.status}`);
    }
    const { access_token } = await tokenRes.json();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: PRICE,
          },
          description: 'CleanRefactor AI Lifetime License',
          custom_id: email, // 将用户邮箱存入订单
        }],
        application_context: {
          return_url: `${SITE_URL}/api/paypal/complete-payment`,
          cancel_url: `${SITE_URL}/?canceled=true`,
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const order = await orderRes.json();
    console.log('PayPal Order created:', order.id);
    
    // 存储订单ID和用户邮箱的关联
    pendingOrders[order.id] = email;
    
    const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      console.error('No approval URL in order:', order);
      throw new Error('No approval URL');
    }
    
    return NextResponse.json({ url: approvalUrl, orderId: order.id });
  } catch (err: any) {
    console.error('PayPal Create Order Error:', err.message);
    return NextResponse.json({ error: 'Pay Error', details: err.message }, { status: 500 });
  }
}

// 导出pendingOrders供complete-payment使用
export { pendingOrders };