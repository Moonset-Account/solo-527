import { NavLink, Form, useNavigate } from "@remix-run/react";
import type { UserRole } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    username: string;
    real_name: string;
    role: UserRole;
    region?: string;
  };
  unreadCount?: number;
}

export function AppLayout({ children, user, unreadCount = 0 }: LayoutProps) {
  const navigate = useNavigate();

  const roleLabels: Record<UserRole, string> = {
    engineer: "工程师",
    supervisor: "区域主管",
    warehouse: "仓库管理员",
    finance: "财务",
  };

  const navItems = [
    { path: "/", label: "工作台", roles: ["engineer", "supervisor", "warehouse", "finance"] },
    { path: "/borrow-orders", label: "借用单", roles: ["engineer", "supervisor", "warehouse", "finance"] },
    { path: "/parts", label: "备件库", roles: ["engineer", "supervisor", "warehouse"] },
    { path: "/inventory", label: "库存管理", roles: ["warehouse", "supervisor"] },
    { path: "/finance", label: "财务对账", roles: ["finance", "supervisor"] },
    { path: "/audit", label: "审计日志", roles: ["supervisor", "finance"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    navigate("/login");
  };

  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <div className="flex items-center gap-4">
            <span className="nav-brand">🔧 备件借用系统</span>
            <div className="nav-links">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  end={item.path === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="nav-user">
            <NavLink to="/notifications" className="nav-link">
              🔔 通知
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#dc2626",
                    color: "white",
                    fontSize: "11px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    marginLeft: "4px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {user.real_name} ({roleLabels[user.role]})
            </span>
            <Form onSubmit={handleLogout}>
              <button type="submit" className="btn btn-outline btn-sm">
                退出
              </button>
            </Form>
          </div>
        </div>
      </nav>
      <main className="container" style={{ padding: "24px 20px" }}>
        {children}
      </main>
    </div>
  );
}
