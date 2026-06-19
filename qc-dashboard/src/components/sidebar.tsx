"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "质检看板", icon: LayoutDashboard },
  { href: "/sessions", label: "会话质检", icon: MessageSquare },
  { href: "/knowledge", label: "知识库", icon: BookOpen },
  { href: "/issues", label: "问题追踪", icon: AlertTriangle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-navy text-white transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-sm font-bold text-navy-dark">
              质检
            </div>
            <span className="text-sm font-semibold tracking-wide">售后质检台</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-navy-light",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-navy-light text-white shadow-sm"
                  : "text-slate-light hover:bg-navy-light/50 hover:text-white"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-navy-light p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
            周
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">质检员周明</p>
              <p className="truncate text-xs text-slate-light">质检专员</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
