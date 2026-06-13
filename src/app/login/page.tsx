import { getCurrentUser, signIn } from "@/app/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4">
            羽
          </div>
          <h1 className="text-2xl font-bold text-slate-800">欢迎回来</h1>
          <p className="text-slate-500 mt-2">登录您的账号继续使用系统</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form action={signIn as unknown as (formData: FormData) => Promise<void>} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">
                  邮箱地址
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="请输入密码"
                  className="input"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                登录
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-center text-slate-600">
                还没有账号？{" "}
                <Link
                  href="/register"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
          <p className="font-medium mb-2">演示账号：</p>
          <ul className="space-y-1">
            <li>管理员：admin@demo.com / admin123</li>
            <li>负责人：manager@demo.com / manager123</li>
            <li>用户：user@demo.com / user123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
