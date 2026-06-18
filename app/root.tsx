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
import tailwindStyles from "./styles/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
];

const navItems = [
  { path: "/", label: "工作台", icon: "📊" },
  { path: "/cashier", label: "预约收银台", icon: "💳" },
  { path: "/treatments", label: "疗程管理", icon: "💆" },
  { path: "/schedules", label: "技师排班", icon: "📅" },
  { path: "/appointments", label: "预约记录", icon: "📋" },
  { path: "/technicians", label: "技师管理", icon: "👩" },
  { path: "/consultants", label: "顾问管理", icon: "👩‍💼" },
  { path: "/materials", label: "耗材管理", icon: "📦" },
  { path: "/material-usages", label: "耗材消耗", icon: "📉" },
  { path: "/commissions", label: "提成管理", icon: "💰" },
  { path: "/reminders", label: "提醒中心", icon: "🔔" },
  { path: "/change-logs", label: "操作日志", icon: "📝" },
];

export function meta() {
  return [
    { title: "美容院管理系统" },
    { name: "description", content: "美容院技师排班后台管理系统" },
  ];
}

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
          <span className="text-2xl">💄</span>
          美容院管理系统
        </h1>
        <p className="text-xs text-gray-500 mt-1">店长后台管理</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? "active" : "text-gray-600"}`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
            店
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">店长</p>
            <p className="text-xs text-gray-500">admin@salon.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const currentPage = navItems.find((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path)
  );

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {currentPage?.label || "工作台"}
        </h2>
        <p className="text-sm text-gray-500">
          管理系统 · 美业管理好帮手
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </div>
      </div>
    </header>
  );
}
