import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FileBarChart,
  CalendarDays,
  BookOpenCheck,
  Megaphone,
  LogOut,
  BellRing,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@/shared/utils";
import type { User } from "@/shared/types";
import tailwind from "./styles/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: "北桥排课消课台 · 少儿编程班教务中心" },
    { name: "description", content: "面向少儿编程班的排课、消课、家校沟通与数据复盘中心" },
    { name: "theme-color", content: "#1F3A5F" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    user: (context as any).user as User | null,
    today: formatDate(new Date()),
    buildInfo: {
      version: "1.0.0",
      env: process.env.NODE_ENV || "development",
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const logoutFetcher = useFetcher();

  useEffect(() => {
    if (!data?.user && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [data?.user, location.pathname, navigate]);

  const isLoginPage = location.pathname === "/login";

  if (isLoginPage || !data?.user) {
    return (
      <html lang="zh-CN">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <Meta />
          <Links />
        </head>
        <body className="min-h-screen">
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  }

  const navItems = [
    { to: "/dashboard", label: "教务工作台", icon: LayoutDashboard, roles: ["teacher", "admin"] },
    { to: "/reports", label: "课时统计报表", icon: FileBarChart, roles: ["teacher", "operator", "admin"] },
    { to: "/reports/monthly", label: "月度复盘", icon: FileBarChart, roles: ["operator", "admin"] },
    { to: "/schedule", label: "班级课表", icon: CalendarDays, roles: ["teacher", "admin"] },
    { to: "/question-bank", label: "题库版本", icon: BookOpenCheck, roles: ["teacher", "admin"] },
    { to: "/notices", label: "通知回执后台", icon: Megaphone, roles: ["operator", "admin"] },
  ];

  const visibleItems = navItems.filter((n) => n.roles.includes(data.user!.role));
  const isOperator = data.user!.role === "operator";

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex">
        <Sidebar
          items={visibleItems}
          user={data.user!}
          today={data.today}
          isOperator={isOperator}
          onLogout={() => logoutFetcher.submit({}, { method: "POST", action: "/api/logout" })}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar user={data.user!} today={data.today} />
          <main className="flex-1 overflow-y-auto px-4 xl:px-8 py-6 pb-10">{children}</main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

function Sidebar({
  items,
  user,
  today,
  isOperator,
  onLogout,
}: {
  items: { to: string; label: string; icon: any; roles: string[] }[];
  user: User;
  today: string;
  isOperator: boolean;
  onLogout: () => void;
}) {
  return (
    <>
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />
      <label
        htmlFor="sidebar-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg2 bg-white border border-slate-200 shadow-card flex items-center justify-center text-slate-700"
      >
        <Menu className="w-5 h-5 peer-checked:hidden" />
        <X className="w-5 h-5 hidden peer-checked:block" />
      </label>
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col",
          "transform transition-transform duration-200 peer-checked:translate-x-0 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg2 bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5 text-mint-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">北桥排课消课台</div>
              <div className="text-[10px] text-slate-400">编程班教务中心 · {today}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto scrollbar-thin">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to !== "/reports/monthly"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg2 text-sm transition-all",
                  isActive
                    ? "bg-slate-800 text-white border-l-2 border-mint-400 pl-[10px]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent pl-[10px]"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg2 bg-slate-800/60">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400">
                {user.role === "admin" ? "管理员" : user.role === "operator" ? "运营" : "教务老师"}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/40 z-30 lg:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity"
      />
    </>
  );
}

function TopBar({ user, today }: { user: User; today: string }) {
  return (
    <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 xl:px-8 pl-16 lg:pl-8">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">今日</span>
        <span className="font-mono text-slate-800 font-medium">{today}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg2 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
          <BellRing className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-breathe" />
        </button>
      </div>
    </header>
  );
}
