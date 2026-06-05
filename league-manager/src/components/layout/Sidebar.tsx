"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shield,
  ClipboardCheck,
  Calendar,
  UserCheck,
  AlertTriangle,
  Building2,
  ScrollText,
  Users,
  UserPlus,
  Trophy,
  CheckCircle,
  MessageSquareWarning,
  Eye,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "首页", href: "/admin", icon: Home },
  { label: "球队管理", href: "/admin/teams", icon: Shield },
  { label: "报名审核", href: "/admin/teams/review", icon: ClipboardCheck },
  { label: "赛程管理", href: "/admin/schedule", icon: Calendar },
  { label: "裁判管理", href: "/admin/referees", icon: Trophy },
  { label: "申诉管理", href: "/admin/appeals", icon: AlertTriangle },
  { label: "场馆管理", href: "/admin/venues", icon: Building2 },
  { label: "审计日志", href: "/admin/audit", icon: ScrollText },
];

const captainNav: NavItem[] = [
  { label: "首页", href: "/captain", icon: Home },
  { label: "我的球队", href: "/captain/team", icon: Shield },
  { label: "球队报名", href: "/captain/team/register", icon: UserPlus },
  { label: "队员管理", href: "/captain/team/roster", icon: Users },
  { label: "赛程查看", href: "/captain/schedule", icon: Calendar },
  { label: "比分确认", href: "/captain/scores", icon: CheckCircle },
  { label: "我的申诉", href: "/captain/appeals", icon: MessageSquareWarning },
];

const refereeNav: NavItem[] = [
  { label: "首页", href: "/referee", icon: Home },
  { label: "我的赛程", href: "/referee/schedule", icon: Calendar },
  { label: "比分录入", href: "/referee/scores", icon: ClipboardCheck },
];

const publicNav: NavItem[] = [
  { label: "赛程", href: "/schedule", icon: Calendar },
  { label: "积分榜", href: "/standings", icon: BarChart3 },
  { label: "消息中心", href: "/messages", icon: Bell },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "captain":
      return captainNav;
    case "referee":
      return refereeNav;
    default:
      return publicNav;
  }
}

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-[260px]"
      } h-screen bg-primary-900 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-bold tracking-wide">联赛管理</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <Trophy className="w-6 h-6 text-accent-400" />
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' + pathname.split('/').slice(1, item.href.split('/').length).join('/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-700 text-white"
                      : "text-primary-200 hover:bg-primary-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-primary-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-primary-300 hover:bg-primary-800 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
