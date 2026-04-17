const fs = require('fs');

fs.writeFileSync('app/api/paypal/capture-order/route.ts', `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { updateUserPaidStatus, updateOrderStatus } from "@/lib/d1";

const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }
  
  const authStr = Buffer.from(\`\${clientId}:\${clientSecret}\`).toString("base64");

  const res = await fetch(\`\${PAYPAL_BASE}/v1/oauth2/token\`, {
    method: "POST",
    headers: {
      Authorization: \`Basic \${authStr}\`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error_description || "Failed to get PayPal access token");
  }
  
  return data.access_token;
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderID } = await req.json();
    const accessToken = await getPayPalAccessToken();
    
    const captureRes = await fetch(
      \`\${PAYPAL_BASE}/v2/checkout/orders/\${orderID}/capture\`,
      {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${accessToken}\`,
          "Content-Type": "application/json",
        },
      }
    );

    const capture = await captureRes.json();
    
    if (!captureRes.ok) {
      return NextResponse.json(
        { error: capture.message || "Failed to capture payment" },
        { status: 500 }
      );
    }
    
    await updateOrderStatus(orderID, "completed");
    await updateUserPaidStatus(session.user.id, true);
    
    return NextResponse.json({
      success: true,
      capture,
      message: "Payment successful! Premium access granted.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to capture payment" },
      { status: 500 }
    );
  }
}
`);

console.log('✅ capture-order/route.ts 已修复！');