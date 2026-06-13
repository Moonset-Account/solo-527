import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "羽毛球馆课程排班系统",
  description: "专业的羽毛球馆场地预约、课程排班和管理系统",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = user?.profile?.role ?? "guest";

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                      羽
                    </div>
                    <span className="font-bold text-lg text-slate-800">
                      羽毛球馆排班系统
                    </span>
                  </Link>
                  {user && (
                    <nav className="hidden md:flex items-center gap-1">
                      <Link
                        href="/"
                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        首页
                      </Link>
                      <Link
                        href="/bookings"
                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        我的预约
                      </Link>
                      {role === "admin" && (
                        <Link
                          href="/admin"
                          className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          管理后台
                        </Link>
                      )}
                      {role === "manager" && (
                        <Link
                          href="/manager"
                          className="px-3 py-2 rounded-md text-sm font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          负责人工作台
                        </Link>
                      )}
                    </nav>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-slate-800">
                          {user.profile?.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {role === "admin"
                            ? "管理员"
                            : role === "manager"
                              ? "负责人"
                              : "普通用户"}
                        </div>
                      </div>
                      <form action="/logout" method="post">
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          退出
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                      >
                        登录
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                      >
                        注册
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} 羽毛球馆课程排班系统 · 让场地管理更高效
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

