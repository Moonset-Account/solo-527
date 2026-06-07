import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, GitBranch, Users, FileText, ChevronLeft } from "lucide-react";
import { useAppStore } from "@/store";
import type { UserRole } from "@/types";

const navItems = [
  { to: "/dashboard", label: "流程总览", icon: LayoutDashboard },
  { to: "/channels", label: "渠道质量", icon: GitBranch },
  { to: "/workload", label: "面试官负载", icon: Users },
  { to: "/report", label: "周报导出", icon: FileText },
];

const roleLabels: Record<UserRole, string> = {
  hr_admin: "HR 管理员",
  recruiting_manager: "招聘经理",
  interviewer: "面试官",
};

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, role, setRole } = useAppStore();
  const location = useLocation();

  return (
    <>
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-16 left-2 z-40 p-2 rounded-lg bg-secondary-bg/80 backdrop-blur border border-accent-cyan/20 text-accent-cyan hover:bg-secondary-bg transition-colors"
        >
          <LayoutDashboard size={20} />
        </button>
      )}

      <aside
        className={`fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-56" : "w-0 -translate-x-full"
        } bg-primary-dark border-r border-accent-cyan/10 flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-accent-cyan/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
              <GitBranch size={18} className="text-accent-cyan" />
            </div>
            <span className="text-lg font-semibold text-white tracking-wide">
              RecruitFlow
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-secondary-bg/80 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan"
                    : "text-slate-400 hover:text-white hover:bg-secondary-bg/60 border-l-2 border-transparent"
                }`}
              >
                <Icon size={18} className={isActive ? "text-accent-cyan" : "text-slate-500 group-hover:text-accent-cyan/70"} />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-accent-cyan/10">
          <label className="text-xs text-slate-500 mb-2 block">当前角色</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-secondary-bg/80 border border-accent-cyan/15 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-accent-cyan/40 transition-colors"
          >
            {(Object.keys(roleLabels) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </>
  );
}
