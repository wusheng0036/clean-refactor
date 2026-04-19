import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/d1";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    const results: any = {
      timestamp: new Date().toISOString(),
      currentUser: email,
      tables: [],
      users: [],
    };

    // 1. 列出所有表
    const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table'");
    results.tables = tables;

    // 2. 查看 users 表结构
    if (tables.success && tables.results) {
      const userTable = tables.results.find((t: any) => t.name === 'users');
      if (userTable) {
        const schema = await queryD1("PRAGMA table_info(users)");
        results.usersTableSchema = schema;
        
        // 3. 列出所有用户（限制10个）
        const allUsers = await queryD1("SELECT id, email, is_paid, provider, created_at FROM users LIMIT 10");
        results.allUsers = allUsers;
        
        // 4. 如果当前用户已登录，查询该用户
        if (email) {
          const currentUser = await queryD1("SELECT * FROM users WHERE email = ?", [email]);
          results.currentUserData = currentUser;
        }
      }
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}
