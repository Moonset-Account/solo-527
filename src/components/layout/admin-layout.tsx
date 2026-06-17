"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Calendar,
  UserCheck,
  Award,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui-store"
import { useAppStore } from "@/store/app-store"

interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  moduleKey?: string
}

const allNavItems: NavItem[] = [
  { label: "数据概览", icon: LayoutDashboard, href: "/admin" },
  { label: "题库管理", icon: BookOpen, href: "/admin/questions", moduleKey: "module_question_bank" },
  { label: "评分标准", icon: Target, href: "/admin/scoring", moduleKey: "module_scoring_standards" },
  { label: "面试安排", icon: Calendar, href: "/admin/interviews", moduleKey: "module_interview_scheduling" },
  { label: "讲师档期", icon: UserCheck, href: "/admin/instructors", moduleKey: "module_instructor_availability" },
  { label: "录用结果", icon: Award, href: "/admin/results", moduleKey: "module_hiring_results" },
  { label: "质量看板", icon: BarChart3, href: "/admin/dashboard", moduleKey: "module_quality_dashboard" },
  { label: "系统设置", icon: Settings, href: "/admin/settings" },
]

function getPageTitle(pathname: string): string {
  const item = allNavItems.find((item) => item.href === pathname)
  if (item) return item.label
  if (pathname.startsWith("/admin/questions")) return "题库管理"
  if (pathname.startsWith("/admin/scoring")) return "评分标准"
  if (pathname.startsWith("/admin/interviews")) return "面试安排"
  if (pathname.startsWith("/admin/instructors")) return "讲师档期"
  if (pathname.startsWith("/admin/results")) return "录用结果"
  if (pathname.startsWith("/admin/dashboard")) return "质量看板"
  if (pathname.startsWith("/admin/settings")) return "系统设置"
  return "数据概览"
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const systemConfigs = useAppStore((s) => s.systemConfigs)
  const unresolvedCount = useAppStore((s) => s.alerts.filter((a) => !a.is_resolved).length)

  const isModuleEnabled = (key?: string): boolean => {
    if (!key) return true
    const config = systemConfigs.find((c) => c.key === key)
    if (!config) return true
    return config.value === "true"
  }

  const navItems = useMemo(
    () => allNavItems.filter((item) => isModuleEnabled(item.moduleKey)),
    [systemConfigs]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={cn(
          "flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight">面试管理</span>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-700 transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-colors text-sm",
                  isActive
                    ? "bg-emerald-500 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white",
                  collapsed && "justify-center px-0 mx-1"
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-400">技术面试测评台 v1.0</p>
          </div>
        )}
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {getPageTitle(pathname)}
          </h1>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-md hover:bg-slate-100 transition-colors">
              <Bell size={20} className="text-slate-600" />
              {unresolvedCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {unresolvedCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
