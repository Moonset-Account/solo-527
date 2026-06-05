'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mask,
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  Wallet,
  Users,
  Bell,
  Settings,
  User,
  Clock,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';

const menuItems = [
  {
    title: '仪表盘',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR', 'TICKET_STAFF', 'USER'],
  },
  {
    title: '剧目管理',
    href: '/productions',
    icon: Mask,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR'],
  },
  {
    title: '排练日历',
    href: '/rehearsals/calendar',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR'],
  },
  {
    title: '场地管理',
    href: '/venues',
    icon: MapPin,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR'],
  },
  {
    title: '请假管理',
    href: '/leaves',
    icon: Clock,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR'],
  },
  {
    title: '演出购票',
    href: '/tickets/shows',
    icon: Ticket,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR', 'TICKET_STAFF', 'USER'],
  },
  {
    title: '扫码验票',
    href: '/tickets/scan',
    icon: QrCode,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'TICKET_STAFF'],
  },
  {
    title: '我的订单',
    href: '/tickets/orders',
    icon: Ticket,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR', 'TICKET_STAFF', 'USER'],
  },
  {
    title: '财务管理',
    href: '/finance/records',
    icon: Wallet,
    roles: ['SUPER_ADMIN', 'COMMITTEE'],
  },
  {
    title: '用户管理',
    href: '/admin/users',
    icon: Users,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: '消息中心',
    href: '/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR', 'TICKET_STAFF', 'USER'],
  },
  {
    title: '个人中心',
    href: '/profile',
    icon: User,
    roles: ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR', 'TICKET_STAFF', 'USER'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'USER';

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <Mask className="h-8 w-8 text-secondary" />
          <span className="text-xl font-display font-bold">梨园剧社</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {session?.user && (
          <div className="mb-4 px-4 py-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-sm">{session.user.name}</p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
            <p className="text-xs text-secondary mt-1">
              {getRoleLabel(session.user.role)}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    COMMITTEE: '社团干事',
    DIRECTOR: '导演',
    ACTOR: '演员',
    TICKET_STAFF: '票务人员',
    USER: '普通用户',
  };
  return labels[role] || role;
}
