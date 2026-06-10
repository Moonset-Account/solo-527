import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { useState } from "react";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-50 min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const [activeRole, setActiveRole] = useState<'pm' | 'admin' | 'coordinator'>('pm');

  const navItems = {
    pm: [
      { label: '采购需求', href: '/pm/requests', match: '/pm/requests' },
      { label: '新建需求', href: '/pm/requests/new', match: '/pm/requests/new' },
    ],
    admin: [
      { label: '报价管理', href: '/admin/quotes', match: '/admin/quotes' },
      { label: '比价中心', href: '/admin/comparison', match: '/admin/comparison' },
      { label: '价格波动', href: '/admin/fluctuations', match: '/admin/fluctuations' },
      { label: '报表中心', href: '/admin/reports', match: '/admin/reports' },
    ],
    coordinator: [
      { label: '资质提醒', href: '/coordinator/alerts', match: '/coordinator/alerts' },
      { label: '审批看板', href: '/coordinator/board', match: '/coordinator/board' },
      { label: '供应商管理', href: '/coordinator/suppliers', match: '/coordinator/suppliers' },
    ],
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg">
                采
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">工程材料询价比价平台</h1>
                <p className="text-xs text-blue-300 opacity-80">Procurement Inquiry & Comparison System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-800/50 rounded-lg p-1 flex gap-1">
                {[
                  { key: 'pm', label: '项目负责人', icon: '👷' },
                  { key: 'admin', label: '管理端', icon: '📊' },
                  { key: 'coordinator', label: '供应商协同', icon: '🤝' },
                ].map(role => (
                  <button
                    key={role.key}
                    onClick={() => {
                      setActiveRole(role.key as any);
                      const firstRoute = navItems[role.key as keyof typeof navItems][0]?.href;
                      if (firstRoute && typeof window !== 'undefined') {
                        window.location.href = firstRoute;
                      }
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeRole === role.key
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-blue-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="mr-1.5">{role.icon}</span>
                    {role.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold">
                  张
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium">张经理</div>
                  <div className="text-xs text-blue-300 opacity-80">采购部</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nav className="bg-slate-800/30 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex gap-1 overflow-x-auto">
              {navItems[activeRole].map(item => {
                const isActive = location.pathname.startsWith(item.match);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      isActive
                        ? 'text-white border-blue-400 bg-white/10'
                        : 'text-blue-200/80 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/documents"
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ml-auto ${
                  location.pathname.startsWith('/documents')
                    ? 'text-white border-blue-400 bg-white/10'
                    : 'text-blue-200/80 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                📄 单据详情
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-6 text-center text-sm text-slate-500">
          © 2025 工程材料询价比价平台 · 采购全流程数字化管理
        </div>
      </footer>
    </div>
  );
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">正在加载平台...</p>
      </div>
    </div>
  );
}
