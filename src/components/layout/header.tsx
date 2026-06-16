"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";

const labelMap: Record<string, string> = {
  "": "仪表盘",
  feedback: "反馈管理",
  "feedback/submit": "提交反馈",
  "feedback/my": "我的反馈",
  "feedback/board": "反馈看板",
  attribution: "归因分析",
  todos: "待办事项",
  knowledge: "知识库",
  "response-time": "响应时间",
  "audit-log": "审计日志",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [
    { label: "首页", href: "/" },
  ];

  let accumulated = "";
  for (const segment of segments) {
    accumulated += `/${segment}`;
    const label = labelMap[accumulated.slice(1)] ?? segment;
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 transition-all duration-300",
        collapsed ? "left-16" : "left-60"
      )}
    >
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
            {index === crumbs.length - 1 ? (
              <span className="font-medium text-slate-800">
                {crumb.label}
              </span>
            ) : (
              <span className="text-slate-500">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
