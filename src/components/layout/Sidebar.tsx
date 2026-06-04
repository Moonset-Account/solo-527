'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  Calendar,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  Settings,
  User,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    title: '仪表板',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    title: '设备管理',
    icon: Package,
    href: '/devices',
  },
  {
    title: '我的预约',
    icon: Calendar,
    href: '/bookings',
  },
  {
    title: '审批中心',
    icon: CheckSquare,
    href: '/approvals',
  },
  {
    title: '故障维护',
    icon: AlertTriangle,
    href: '/maintenance',
  },
  {
    title: '报表中心',
    icon: BarChart3,
    href: '/reports',
  },
  {
    title: '资格证书',
    icon: ClipboardList,
    href: '/certificates',
  },
  {
    title: '个人中心',
    icon: User,
    href: '/profile',
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary-800 px-2 py-4">
            🔬 实验室预约平台
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
