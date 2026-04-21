# CleanRefactor AI - 项目架构文档

## 项目概述

**产品名称**: CleanRefactor AI  
**定位**: AI 代码重构工具（出海产品）  
**核心功能**: 智能代码重构 + JavaScript 执行顺序分析  
**部署地址**: https://cleanrefactor-ai.vercel.app

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Next.js 15 + React + TypeScript | App Router 模式 |
| **样式** | Tailwind CSS | 暗色主题，科技感设计 |
| **认证** | NextAuth v5 | 支持 Google / GitHub / 邮箱登录 |
| **数据库** | Cloudflare D1 | SQLite 边缘数据库 |
| **支付** | PayPal | 生产环境已配置 |
| **AI API** | 硅基流动 (DeepSeek-V2.5) + 智谱 (GLM-4) | 自动切换 |
| **部署** | Vercel | 自动 CI/CD |
| **邮件** | Resend | 邮箱登录魔法链接 |

---

## 项目结构

```
clean-refactor/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/[...nextauth]/   # NextAuth 认证路由
│   │   ├── paypal/               # PayPal 支付相关
│   │   │   ├── create-order/     # 创建订单
│   │   │   ├── capture-order/    # 捕获订单
│   │   │   └── complete-payment/ # 完成支付
│   │   ├── refactor/             # AI 重构核心 API
│   │   ├── user/status/          # 用户状态查询
│   │   └── debug/                # 调试接口
│   ├── login/                    # 登录页面
│   ├── verify-request/           # 邮箱验证提示页
│   ├── refactor/                 # 重构工作页面（核心功能）
│   ├── success/                  # 支付成功页
│   ├── home-content.tsx          # 首页内容组件
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/                   # React 组件
│   └── CodeEditor.tsx            # 代码编辑器（Monaco）
├── lib/                          # 工具库
│   ├── auth.ts                   # NextAuth 配置导出
│   ├── d1.ts                     # D1 数据库操作
│   └── utils.ts                  # 通用工具
├── auth.ts                       # NextAuth 主配置
├── middleware.ts                 # 中间件（可选）
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
└── .env.local                    # 环境变量（本地）
```

---

## 核心流程

### 1. 用户认证流程

```
用户访问 /refactor
    ↓
未登录 → 重定向到 /login
    ↓
选择登录方式: Google / GitHub / 邮箱
    ↓
NextAuth 处理 OAuth / 发送魔法链接
    ↓
登录成功 → 返回 /refactor
```

### 2. 支付流程

```
用户点击"Upgrade"或访问 /refactor（未付费）
    ↓
滚动到定价页面
    ↓
点击支付 → 调用 /api/paypal/create-order
    ↓
PayPal 返回 approval_url
    ↓
用户完成 PayPal 支付
    ↓
PayPal 重定向到 /api/paypal/complete-payment
    ↓
验证订单 → 更新 D1 数据库 isPaid = true
    ↓
重定向到 /success
    ↓
用户获得 PRO 权限
```

### 3. AI 重构流程

```
用户在 /refactor 输入代码
    ↓
点击 Refactor 按钮
    ↓
POST /api/refactor
    ↓
检测代码类型:
    - 包含事件循环关键词 → 使用智谱 GLM-4
    - 普通代码 → 使用硅基 DeepSeek-V2.5
    ↓
调用 AI API
    ↓
返回重构结果或执行顺序分析
    ↓
前端展示结果
```

---

## 数据库结构 (D1)

### users 表

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  isPaid INTEGER DEFAULT 0,      -- 0 = 免费, 1 = 付费
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `isPaid` | INTEGER | 付费状态，支付成功后设为 1 |
| `email` | TEXT | 用户主键，关联 PayPal 订单 |

---

## 环境变量清单

### 必需变量

```bash
# 核心认证
NEXTAUTH_URL=https://cleanrefactor-ai.vercel.app
NEXT_PUBLIC_SITE_URL=https://cleanrefactor-ai.vercel.app
NEXTAUTH_SECRET=<随机字符串>

# Google 登录
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>

# GitHub 登录
GITHUB_CLIENT_ID=<GitHub OAuth App>
GITHUB_CLIENT_SECRET=<GitHub OAuth App>

# PayPal 生产环境
PAYPAL_CLIENT_ID=<PayPal Live App>
PAYPAL_SECRET=<PayPal Live Secret>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<PayPal Live App>
PAYPAL_MODE=live

# Cloudflare D1
CLOUDFLARE_ACCOUNT_ID=<Cloudflare 账户 ID>
D1_DATABASE_ID=<D1 数据库 ID>
CLOUDFLARE_API_TOKEN=<Cloudflare API Token>
D1_DATABASE_NAME=cleanrefactor

# AI API (硅基流动)
OPENAI_API_KEY=<硅基流动 API Key>
OPENAI_BASE_URL=https://api.siliconflow.cn/v1

# 邮件 (Resend)
RESEND_API_KEY=<Resend API Key>
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## API 接口说明

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | ALL | NextAuth 认证路由 |

### 支付相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/paypal/create-order` | POST | 创建 PayPal 订单 |
| `/api/paypal/capture-order` | POST | 捕获订单（备用） |
| `/api/paypal/complete-payment` | GET | 支付完成回调 |

### 功能相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/refactor` | POST | AI 代码重构核心接口 |
| `/api/user/status` | GET | 查询用户付费状态 |

---

## AI 模型配置

### 自动切换逻辑

```typescript
// 检测是否为执行顺序分析代码
function isExecutionTraceCode(code: string): boolean {
  const patterns = [
    /setTimeout|setImmediate|process\.nextTick/,
    /Promise|async|await/,
    /console\.log/,
    /event\s*loop|执行顺序|输出顺序/i,
  ];
  
  const matchCount = patterns.filter(p => p.test(code)).length;
  return matchCount >= 3 || /输出顺序|执行顺序/.test(code);
}

// 模型选择
if (isExecutionTraceCode(code)) {
  model = 'zhipu';  // 智谱 GLM-4，更强推理能力
} else {
  model = 'silicon'; // 硅基 DeepSeek-V2.5，更快更便宜
}
```

### API 配置

| 提供商 | 模型 | 用途 | Base URL |
|--------|------|------|----------|
| 硅基流动 | DeepSeek-V2.5 | 普通重构 | https://api.siliconflow.cn/v1 |
| 智谱 | GLM-4 | 执行顺序分析 | https://open.bigmodel.cn/api/paas/v4 |

---

## 部署流程

### 正确方式（Git Push）

```bash
# 修改代码
git add .
git commit -m "feat: xxx"
git push origin main

# Vercel 自动拉取并部署
```

### ❌ 错误方式（避免）

```bash
# 不要用 CLI 直接部署
vercel --prod  # 这会绕过 GitHub，导致代码不一致
```

---

## 关键文件说明

### auth.ts
NextAuth v5 主配置文件，定义：
- Providers (Google, GitHub, Email)
- Session 策略 (JWT)
- Callbacks (signIn, session)

### lib/d1.ts
D1 数据库操作封装：
- `getUserByEmail(email)`
- `createUser(userData)`
- `updateUserPayment(email, isPaid)`
- `getUserPaymentStatus(email)`

### app/refactor/page.tsx
核心功能页面，包含：
- 代码编辑器（输入/输出）
- Refactor 按钮
- 执行顺序分析展示
- 付费状态判断

### app/api/refactor/route.ts
AI 重构 API，处理：
- 模型选择逻辑
- AI API 调用
- 结果格式化

---

## 常见问题排查

### 支付问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 支付后仍显示免费 | D1 未更新 | 检查 Cloudflare API Token 权限 |
| PayPal 报错 | 环境变量错误 | 确认 PAYPAL_MODE=live |
| 订单创建失败 | Client ID 错误 | 检查 PayPal Live 凭证 |

### 登录问题

| 现象 | 原因 | 解决 |
|------|------|------|
| OAuth 失败 | Callback URL 不匹配 | 检查 NEXTAUTH_URL |
| 邮箱收不到 | Resend 限制 | 确认域名验证 |

### AI 问题

| 现象 | 原因 | 解决 |
|------|------|------|
| API 报错 | 余额不足 | 硅基流动充值 |
| 返回格式错乱 | Prompt 问题 | 检查 system prompt |

---

## 后续维护建议

### 监控指标

1. **支付转化率** — 访问定价页 → 完成支付比例
2. **AI API 成本** — 硅基流动 + 智谱月度费用
3. **用户留存** — 注册后 7 天/30 天活跃率
4. **错误率** — API 5xx 错误监控

### 迭代方向

1. **功能扩展**
   - 支持更多语言（Python, Go, Rust）
   - 代码解释功能
   - Bug 检测功能

2. **体验优化**
   - 历史记录保存
   - 代码分享功能
   - 团队协作版本

3. **商业化**
   - 订阅制（月付/年付）
   - 用量计费
   - Team/Enterprise 版本

---

## 联系人

- **项目**: CleanRefactor AI
- **部署**: Vercel + Cloudflare
- **维护**: 风火轮 🌀

---

*最后更新: 2026-04-21*
