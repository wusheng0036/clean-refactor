"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    await signIn("email", { 
      email, 
      callbackUrl: "/",
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
        {/* 标题区 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            CleanRefactor
          </h1>
          <p className="text-blue-100 text-lg">
            登录以使用 AI 代码重构
          </p>
        </div>

        {/* 邮箱登录 */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading ? "发送中..." : "使用邮箱登录"}
          </button>
        </form>

        {/* 底部说明 */}
        <div className="text-center text-blue-200/80 text-sm pt-4">
          登录即表示您同意服务条款
        </div>
      </div>
    </div>
  );
}
