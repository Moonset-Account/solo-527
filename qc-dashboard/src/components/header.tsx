"use client"

import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "质检看板",
  "/sessions": "会话质检",
  "/knowledge": "知识库",
  "/issues": "问题追踪",
}

export default function Header() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/")
    const label = breadcrumbMap[path] || seg
    return { path, label }
  })

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-light">首页</span>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2">
            <span className="text-slate-light">/</span>
            <span className={i === breadcrumbs.length - 1 ? "font-medium text-navy" : "text-slate-light"}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-light transition-colors hover:bg-surface hover:text-navy">
          <Search size={16} />
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-light transition-colors hover:bg-surface hover:text-navy">
          <Bell size={16} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  )
}
