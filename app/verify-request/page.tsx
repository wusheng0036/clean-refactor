export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">查看您的邮箱</h2>
        <p className="text-gray-300 mb-6">
          我们已发送登录链接到您的邮箱。请点击邮件中的链接完成登录。
        </p>
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">
            提示：邮件可能需要几分钟到达，请检查垃圾邮件文件夹。
          </p>
        </div>
        <a
          href="/"
          className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
