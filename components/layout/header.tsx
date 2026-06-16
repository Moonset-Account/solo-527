'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, Menu } from 'lucide-react';
import { trpc } from '@/components/providers/trpc-provider';
import { Badge } from '@/components/ui/badge';
import { getRoleLabel } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();
  const { data: currentUser } = trpc.user.me.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: alertStats } = trpc.alert.stats.useQuery(undefined, {
    enabled: currentUser?.role === 'PRO_BONO_LAWYER' || currentUser?.role === 'ADMIN',
  });

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {typeof window !== 'undefined' && document.title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {(currentUser?.role === 'PRO_BONO_LAWYER' || currentUser?.role === 'ADMIN') && (
          <div className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            {alertStats && alertStats.open > 0 && (
              <Badge
                variant="danger"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {alertStats.open}
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-slate-500">
              {currentUser ? getRoleLabel(currentUser.role) : '加载中...'}
            </p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
