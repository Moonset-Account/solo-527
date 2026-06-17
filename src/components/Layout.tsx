import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  FileText,
  Truck,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "指标", href: "/metrics", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "异常", href: "/anomalies", icon: <AlertTriangle className="w-5 h-5" /> },
  { label: "口径", href: "/definitions", icon: <FileText className="w-5 h-5" /> },
  { label: "交付", href: "/delivery", icon: <Truck className="w-5 h-5" /> },
  { label: "设置", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-card-border transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-card-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-foreground">增长分析</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-slate-100",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-card-border">
            <div className="p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-muted-foreground mb-2">当前版本</p>
              <p className="text-sm font-medium text-foreground">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-card border-b border-card-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索指标、异常..."
                  className="w-64 pl-9 pr-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-card-border">
                      <h3 className="font-semibold text-foreground">告警通知</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-card-border">
                        <p className="text-sm font-medium text-foreground">DAU 异常下跌</p>
                        <p className="text-xs text-muted-foreground mt-1">2分钟前</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-card-border">
                        <p className="text-sm font-medium text-foreground">转化率异常波动</p>
                        <p className="text-xs text-muted-foreground mt-1">15分钟前</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <p className="text-sm font-medium text-foreground">新增用户数达标</p>
                        <p className="text-xs text-muted-foreground mt-1">1小时前</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-card-border">
                      <button className="text-sm text-primary hover:underline w-full text-center">
                        查看全部
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">管理员</p>
                    <p className="text-xs text-muted-foreground">admin@company.com</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden">
                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors text-foreground">
                      个人设置
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors text-foreground">
                      账户安全
                    </button>
                    <div className="border-t border-card-border" />
                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors text-danger">
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={cn("p-4 lg:p-6", className)}>{children}</main>
      </div>
    </div>
  );
}
