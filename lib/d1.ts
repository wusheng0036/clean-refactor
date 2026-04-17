// Cloudflare D1 数据库连接配置
const D1_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

export interface D1Result {
  success: boolean;
  results?: any[];
  error?: string;
}

// 执行 D1 SQL 查询
export async function queryD1(sql: string, params?: any[]): Promise<D1Result> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return { success: false, error: "D1 credentials not configured" };
  }

  try {
    const res = await fetch(
      `${D1_API_BASE}/${accountId}/d1/database/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      console.error("D1 query error:", data.errors);
      return { success: false, error: data.errors?.[0]?.message || "Query failed" };
    }

    return { success: true, results: data.result?.[0]?.results || [] };
  } catch (error: any) {
    console.error("D1 connection error:", error);
    return { success: false, error: error.message };
  }
}

// 用户相关操作
export async function getUserById(id: string) {
  const result = await queryD1(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return result.success && result.results?.length ? result.results[0] : null;
}

export async function getUserByEmail(email: string) {
  const result = await queryD1(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return result.success && result.results?.length ? result.results[0] : null;
}

export async function createUser(user: {
  id: string;
  email: string;
  name?: string;
  provider: string;
}) {
  return await queryD1(
    "INSERT INTO users (id, email, name, provider, is_paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    [user.id, user.email, user.name || null, user.provider, 0]
  );
}

export async function updateUserPaidStatus(id: string, isPaid: boolean) {
  return await queryD1(
    "UPDATE users SET is_paid = ?, updated_at = datetime('now') WHERE id = ?",
    [isPaid ? 1 : 0, id]
  );
}

// 订单相关操作
export async function createOrder(order: {
  id: string;
  user_id: string;
  paypal_order_id: string;
  amount: number;
  currency: string;
  status: string;
}) {
  return await queryD1(
    "INSERT INTO orders (id, user_id, paypal_order_id, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    [order.id, order.user_id, order.paypal_order_id, order.amount, order.currency, order.status]
  );
}

export async function updateOrderStatus(orderId: string, status: string) {
  return await queryD1(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, orderId]
  );
}
