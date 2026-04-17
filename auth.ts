import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

const isDev = process.env.NODE_ENV === "development";

// 初始化 Resend
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-request",
  },
  providers: [
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        if (!resend) {
          console.error("Resend not initialized");
          return;
        }

        try {
          await resend.emails.send({
            from: provider.from!,
            to: email,
            subject: "登录到 CleanRefactor",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">欢迎登录 CleanRefactor</h2>
                <p>点击下方按钮登录您的账户：</p>
                <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">登录</a>
                <p style="color: #666; font-size: 14px;">或者复制此链接到浏览器：</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">此链接将在24小时后过期。</p>
              </div>
            `,
          });
          console.log("Verification email sent to:", email);
        } catch (error) {
          console.error("Failed to send verification email:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      return session;
    },
  },
});
