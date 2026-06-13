import { redirect } from "next/navigation";

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";

export default function SignInPage() {
  if (USE_MOCK_AUTH) redirect("/dashboard");

  let SignIn: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const clerk = require("@clerk/nextjs");
    SignIn = clerk.SignIn;
  } catch {}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-50 via-white to-primary-50">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦷</div>
          <h1 className="text-3xl font-bold text-dental-700 mb-2">齿悦管家</h1>
          <p className="text-slate-500">牙科诊所客户回访管理系统</p>
        </div>
        <div className="card">
          <div className="card-body">
            {SignIn ? (
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-dental-600 hover:bg-dental-700",
                    footerActionLink: "text-dental-600 hover:text-dental-700",
                  },
                }}
              />
            ) : (
              <div className="text-center py-6 text-slate-500">
                请配置 Clerk 环境变量或启用 Mock 认证
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
