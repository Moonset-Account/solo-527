import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
  useLocation
} from "@remix-run/react";
import { useEffect, useState } from "react";
import "./tailwind.css";

export const links = () => [
  { rel: "icon", href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏭</text></svg>" }
];

export async function loader({ request }) {
  const cookie = request.headers.get("Cookie") || "";
  return json({ cookie });
}

const NAV = [
  { to: "/workorders", label: "工单管理", icon: "📋", roles: ["planner", "admin"] },
  { to: "/schedules", label: "生产排期", icon: "📅", roles: ["planner", "admin"] },
  { to: "/daily", label: "日常处理", icon: "⚙️", roles: ["planner", "admin"] },
  { to: "/risks", label: "交期风险", icon: "⚠️", roles: ["planner", "admin"] },
  { to: "/batches", label: "追溯批次", icon: "🔍", roles: ["planner", "admin"] },
  { to: "/responsibles", label: "责任人维护", icon: "👥", roles: ["admin"] },
  { to: "/logs", label: "操作日志", icon: "📝", roles: ["admin"] }
];

export default function App() {
  const data = useLoaderData();
  const nav = useNavigate();
  const loc = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        if (r.ok) {
          const d = await r.json();
          setUser(d.user);
        } else if (!loc.pathname.startsWith("/login")) {
          nav("/login");
        }
      } catch {}
      setLoading(false);
    })();
  }, [loc.pathname]);

  if (loc.pathname.startsWith("/login")) {
    return (
      <html lang="zh-CN">
        <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><Meta /><Links /><title>登录 | 工单质量追溯系统</title></head>
        <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"><Outlet /><ScrollRestoration /><Scripts /></body>
      </html>
    );
  }

  if (loading || !user) {
    return (
      <html lang="zh-CN">
        <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><Meta /><Links /><title>加载中...</title></head>
        <body className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-slate-500">加载中...</div>
          <ScrollRestoration /><Scripts />
        </body>
      </html>
    );
  }

  const visibleNav = NAV.filter(i => i.roles.includes(user.role));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    nav("/login");
  };

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>工单质量追溯系统</title>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800">
        <div className="flex h-screen overflow-hidden">
          <aside className={`${collapsed ? "w-16" : "w-60"} bg-slate-900 text-slate-100 flex flex-col transition-all duration-200`}>
            <div className="h-16 flex items-center px-4 border-b border-slate-700 justify-between">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏭</span>
                  <div>
                    <div className="font-bold text-sm">工单追溯系统</div>
                    <div className="text-xs text-slate-400">Quality Trace</div>
                  </div>
                </div>
              )}
              <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white text-lg p-1">
                {collapsed ? "›" : "‹"}
              </button>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {visibleNav.map(item => {
                const active = loc.pathname.startsWith(item.to);
                return (
                  <a key={item.to} href={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg my-0.5 transition-colors ${active ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:bg-slate-800"}`}>
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                );
              })}
            </nav>
            {!collapsed && (
              <div className="border-t border-slate-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-slate-400">
                      {user.role === "admin" ? "管理员" : "计划员"} · {user.department}
                    </div>
                  </div>
                </div>
                <button onClick={logout} className="w-full text-xs text-slate-400 hover:text-white py-1.5 rounded hover:bg-slate-800">
                  退出登录
                </button>
              </div>
            )}
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
              <h1 className="text-lg font-semibold text-slate-800">
                {visibleNav.find(n => loc.pathname.startsWith(n.to))?.label || "工作台"}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-brand-50 text-brand-700 border border-brand-200">
                  {user.role === "admin" ? "ADMIN" : "PLANNER"}
                </span>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <Outlet context={{ user }} />
            </div>
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
