import { getCurrentUser, signUp } from "@/app/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4">
            羽
          </div>
          <h1 className="text-2xl font-bold text-slate-800">创建新账号</h1>
          <p className="text-slate-500 mt-2">注册后即可预约场地和课程</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form action={signUp as unknown as (formData: FormData) => Promise<void>} className="space-y-4">
              <div>
                <label className="label" htmlFor="full_name">
                  姓名
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="您的姓名"
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  手机号
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="13800138000"
                  className="input"
                />
              </div>
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
                  minLength={6}
                  placeholder="至少 6 位字符"
                  className="input"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                注册账号
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-center text-slate-600">
                已有账号？{" "}
                <Link
                  href="/login"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  去登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
