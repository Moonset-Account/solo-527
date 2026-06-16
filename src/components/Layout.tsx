import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Wrench,
  FileText,
  Calculator,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/rooms', label: '房源管理', icon: Building2 },
  { path: '/appointments', label: '预约看房', icon: CalendarCheck },
  { path: '/work-orders', label: '派工回访', icon: Wrench },
  { path: '/contracts', label: '合同签署', icon: FileText },
  { path: '/settlements', label: '业主结算', icon: Calculator },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/messages', label: '消息中心', icon: MessageSquare },
  { path: '/payments', label: '支付流水', icon: CreditCard },
  { path: '/settings', label: '配置中心', icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/rooms': '房源管理',
  '/appointments': '预约看房',
  '/appointments/calendar': '预约日历',
  '/work-orders': '派工回访',
  '/contracts': '合同签署',
  '/contracts/templates': '合同模板',
  '/settlements': '业主结算',
  '/exceptions': '异常处理',
  '/messages': '消息中心',
  '/payments': '支付流水',
  '/settings': '配置中心',
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { path: string; label: string }[] = [{ path: '/', label: '首页' }];
  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    const label = breadcrumbMap[currentPath];
    if (label) {
      crumbs.push({ path: currentPath, label });
    } else if (!isNaN(Number(part))) {
      const parentPath = currentPath.replace(/\/\d+$/, '');
      const parentLabel = breadcrumbMap[parentPath];
      if (parentLabel) {
        crumbs.push({ path: parentPath, label: parentLabel });
      }
      crumbs.push({ path: currentPath, label: '详情' });
    } else {
      const parentPath = currentPath.replace(/\/[^/]+$/, '');
      const parentLabel = breadcrumbMap[parentPath];
      if (parentLabel) {
        crumbs.push({ path: parentPath, label: parentLabel });
      }
      crumbs.push({ path: currentPath, label: part });
    }
  }
  return crumbs;
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      <aside
        className={`flex flex-col bg-[#1E293B] border-r border-[#334155] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center h-14 px-4 border-b border-[#334155]">
          {!collapsed && (
            <span className="text-[#F97316] font-bold text-lg truncate">租后服务中心</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded hover:bg-[#334155] text-[#94A3B8]"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#F97316] text-white'
                    : 'text-[#94A3B8] hover:bg-[#334155] hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center h-14 px-6 border-b border-[#334155] bg-[#1E293B]">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-2">
                {i === 0 && <Home size={14} className="text-[#94A3B8]" />}
                {i > 0 && <span className="text-[#475569]">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-[#F1F5F9]">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="text-[#94A3B8] hover:text-[#F97316]">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
