import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { AppShell } from "./AppShell";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold">服务器告警资产配置库</h1>
            <p className="mt-1 text-sm text-slate-500">请登录以访问系统</p>
          </div>
          <SignIn />
        </div>
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
