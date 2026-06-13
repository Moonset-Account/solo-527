"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Bell,
  User,
} from "lucide-react";
import { SidebarNav, TopNav } from "@/components/layout/Navigation";

const mobileNavItems = [
  { label: "看板", href: "/", icon: LayoutDashboard },
  { label: "异常", href: "/anomalies", icon: AlertTriangle },
  { label: "告警", href: "/alerts/rules", icon: Bell },
  { label: "我的", href: "/settings", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-neutral-50">
      <SidebarNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-primary-600" : "text-neutral-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
