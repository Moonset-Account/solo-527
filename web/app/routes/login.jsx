import { Form, useActionData, useNavigate } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { useState } from "react";

export async function action({ request }) {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  try {
    const resp = await fetch(`${process.env.API_BASE || "http://localhost:4000"}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await resp.json();
    if (!resp.ok) return json({ error: data.error }, { status: resp.status });
    const cookieHeader = resp.headers.get("set-cookie") || "";
    return redirect("/workorders", {
      headers: { "Set-Cookie": cookieHeader || `token=${data.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200` }
    });
  } catch (e) {
    return json({ error: "服务不可用，请确认后端是否启动" }, { status: 500 });
  }
}

export default function LoginPage() {
  const actionData = useActionData();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") })
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error); setLoading(false); return; }
      nav("/workorders");
    } catch (ex) {
      setErr("无法连接到服务器，请检查后端是否已启动");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏭</div>
          <h1 className="text-2xl font-bold text-slate-800">小批量工单质量追溯系统</h1>
          <p className="text-slate-500 mt-2 text-sm">Work Order Quality Traceability Platform</p>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold mb-5">登录账号</h2>
            <form onSubmit={submit} className="space-y-4">
              {(err || actionData?.error) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                  {err || actionData?.error}
                </div>
              )}
              <div>
                <label className="label">用户名</label>
                <input type="text" name="username" defaultValue="admin" required className="input" placeholder="请输入用户名" />
              </div>
              <div>
                <label className="label">密码</label>
                <input type="password" name="password" defaultValue="admin123" required className="input" placeholder="请输入密码" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? "登录中..." : "登 录"}
              </button>
            </form>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">测试账号（已初始化种子数据）：</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-medium text-slate-700">管理员</div>
                  <div className="text-slate-500 font-mono">admin / admin123</div>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-medium text-slate-700">计划员</div>
                  <div className="text-slate-500 font-mono">planner1 / planner123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">© 2025 工单追溯系统 · Remix + Express + MongoDB + Redis</p>
      </div>
    </div>
  );
}
