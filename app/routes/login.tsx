import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigate, useSearchParams } from "@remix-run/react";
import { Loader2, BookOpenCheck, Lock, User2 } from "lucide-react";
import { useState, useEffect } from "react";
import { login } from "@/server/services/authService";
import { writeAudit } from "@/server/services/auditService";

export const meta = () => [{ title: "登录 · 北桥排课消课台" }];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ ok: true });
}

export async function action({ request, context }: ActionFunctionArgs) {
  let username = "", password = "";
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    username = String(body.username || "");
    password = String(body.password || "");
  } else {
    const form = await request.formData();
    username = String(form.get("username") || "");
    password = String(form.get("password") || "");
  }
  if (!username || !password) {
    return json({ error: "请输入账号和密码" }, { status: 400 });
  }
  const ip = (context as any).ip;
  const result = await login(username, password, ip);
  if (!result) {
    return json({ error: "账号或密码错误" }, { status: 401 });
  }
  const ctx: any = context;
  if (ctx.user) {
    await writeAudit(ctx.user, "login", "user", result.user.id, {}, ip);
  }
  const redirectTo = new URL(request.url).searchParams.get("redirect") || "/dashboard";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return json(
    { success: true, redirectTo, user: result.user },
    {
      headers: {
        "Set-Cookie": `sid=${result.sid}; Path=/; Max-Age=${7 * 24 * 3600}${secure}`,
      },
    }
  );
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (actionData?.success && actionData.redirectTo) {
      setTimeout(() => {
        window.location.href = actionData.redirectTo;
      }, 300);
    }
  }, [actionData]);

  const demoAccounts = [
    { role: "管理员", u: "admin", p: "admin123", tip: "全部权限" },
    { role: "教务老师", u: "teacher1", p: "teacher123", tip: "消课+课表" },
    { role: "运营", u: "operator", p: "operator123", tip: "通知回执" },
  ];

  const loginAs = (u: string, p: string) => {
    const f = document.getElementById("demo-form") as HTMLFormElement;
    (f.elements.namedItem("username") as HTMLInputElement).value = u;
    (f.elements.namedItem("password") as HTMLInputElement).value = p;
    setTimeout(() => f.requestSubmit(), 50);
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-mint-500 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-amber-500 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center">
              <BookOpenCheck className="w-7 h-7 text-mint-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">北桥排课消课台</h1>
              <p className="text-sm text-slate-400 mt-0.5">少儿编程班 · 家校沟通中心</p>
            </div>
          </div>
          <h2 className="text-white text-xl font-bold leading-snug mb-4">
            一线教务效率提升 30%+
          </h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded bg-mint-500/20 border border-mint-500/40 flex items-center justify-center mt-0.5 shrink-0 text-[10px] text-mint-400 font-bold">1</span>
              <span>消课录入 · 同班课表+题库版本同一处理区，少跳转</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mt-0.5 shrink-0 text-[10px] text-amber-400 font-bold">2</span>
              <span>课时统计 · 操作留痕 &amp; 家校反馈全部嵌报表，不脱节</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded bg-slate-700/50 border border-slate-600 flex items-center justify-center mt-0.5 shrink-0 text-[10px] text-slate-300 font-bold">3</span>
              <span>移动端响应式，录入 &amp; 审核全触屏可用</span>
            </li>
          </ul>
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="text-xs text-slate-500 mb-2">今日概览 · Design 2026</div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-11 h-11 rounded-lg2 bg-slate-800 flex items-center justify-center">
              <BookOpenCheck className="w-6 h-6 text-mint-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">北桥排课消课台</div>
              <div className="text-[11px] text-slate-500">编程班教务中心</div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">欢迎登录</h2>
          <p className="text-sm text-slate-500 mb-7">使用账号密码登录教务系统</p>

          <Form
            id="demo-form"
            method="post"
            onSubmit={() => setSubmitting(true)}
            className="space-y-4"
          >
            <div>
              <label className="input-label">账号</label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="username"
                  defaultValue={searchParams.get("u") || ""}
                  className="input pl-9"
                  placeholder="请输入账号"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="input-label">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  defaultValue={searchParams.get("p") || ""}
                  className="input pl-9"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {actionData?.error && (
              <div className="rounded-lg2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs">
                {actionData.error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-11 text-base disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              登录系统
            </button>
          </Form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 mb-3">演示账号（点击快捷登录）</div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.u}
                  onClick={() => {
                    loginAs(a.u, a.p);
                  }}
                  className="group text-left px-2.5 py-2 rounded-lg2 border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all"
                >
                  <div className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
                    {a.role}
                  </div>
                  <div className="text-[10px] text-slate-400">{a.tip}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 text-center text-[10px] text-slate-400">
            © 2026 北桥编程 · 仅供内部使用
          </div>
        </div>
      </div>
    </div>
  );
}
