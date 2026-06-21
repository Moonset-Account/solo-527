'use client';

import { useState } from 'react';
import { Sidebar, Header } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': '经营驾驶舱',
  '/orders': '订单管理',
  '/orders/new': '新建订单',
  '/delivery': '交付追踪',
  '/price-list': '客户价目表',
  '/parts': '配件档案',
  '/parts/inventory': '库存周转',
  '/parts/in-out': '出入库记录',
  '/quality': '质检记录',
  '/quality/failed': '不合格处理',
  '/config/metrics': '指标口径配置',
  '/config/permissions': '角色权限管理',
  '/config/users': '用户管理',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const title = pageTitles[pathname] || '汽配驾驶舱';

  return (
    <div className="min-h-screen bg-metal-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          title={title}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
