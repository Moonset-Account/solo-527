import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  AlertTriangle,
  Target,
  Settings,
  Zap,
  MapPin,
  Network,
  FileText,
  Bell,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../store/app';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { endpoints } from '../lib/api';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
  children?: NavItem[];
}

function buildNav(alertUnread: number): NavItem[] {
  return [
    { to: '/', label: '能耗看板', icon: LayoutDashboard },
    {
      to: '/alerts',
      label: '告警中心',
      icon: AlertTriangle,
      badge: alertUnread,
    },
    { to: '/targets', label: '节能目标', icon: Target },
    { to: '/offline', label: '表计离线', icon: Network, badge: undefined },
    { to: '/config/subsidies', label: '配置中心', icon: Settings },
  ];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentUser = useApp((s) => s.currentUser);
  const alertUnread = useApp((s) => s.alertUnread);
  const nav = buildNav(alertUnread);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showBell, setShowBell] = useState(false);

  useEffect(() => {
    endpoints.alerts.reminders(30).then(setReminders).catch(() => {});
  }, []);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const configActive = location.pathname.startsWith('/config');

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Sun size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">光伏能耗看板</div>
            <div className="text-xs text-slate-500">Solar Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            if (item.to.startsWith('/config')) {
              return (
                <div key={item.to} className="mt-4 space-y-1">
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    配置管理
                  </div>
                  {[
                    { to: '/config/subsidies', label: '补贴记录', icon: FileText },
                    { to: '/config/zones', label: '分区管理', icon: MapPin },
                    { to: '/config/meters', label: '表计管理', icon: Zap },
                    { to: '/config/audit', label: '操作日志', icon: FileText },
                  ].map((c) => {
                    const Icon = c.icon;
                    const active = isActive(c.to);
                    return (
                      <Link
                        key={c.to}
                        to={c.to}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        <Icon size={17} />
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              );
            }
            const Icon = item.icon;
            const active = isActive(item.to) && !configActive;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon size={17} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[11px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">
                {currentUser?.name || '加载中'}
              </div>
              <div className="truncate text-xs text-slate-500">
                {(
                  { admin: '管理员', manager: '电站负责人', operator: '运维', viewer: '访客' } as Record<
                    string,
                    string
                  >
                )[currentUser?.role || 'viewer']}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {(() => {
              const path = location.pathname;
              const crumbs: { to: string; label: string }[] = [{ to: '/', label: '首页' }];
              if (path !== '/') {
                const seg = path.split('/').filter(Boolean);
                const labels: Record<string, string> = {
                  alerts: '告警中心',
                  targets: '节能目标',
                  offline: '表计离线',
                  config: '配置中心',
                  subsidies: '补贴记录',
                  zones: '分区管理',
                  meters: '表计管理',
                  audit: '操作日志',
                };
                seg.forEach((s, i) => {
                  crumbs.push({
                    to: '/' + seg.slice(0, i + 1).join('/'),
                    label: labels[s] || s,
                  });
                });
              }
              return crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={14} />}
                  <Link to={c.to} className={i === crumbs.length - 1 ? 'text-slate-900 font-medium' : 'hover:text-slate-700'}>
                    {c.label}
                  </Link>
                </span>
              ));
            })()}
          </div>
          <div className="relative">
            <button
              className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setShowBell((s) => !s)}
            >
              <Bell size={18} />
              {alertUnread > 0 && (
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger-500"></span>
              )}
            </button>
            {showBell && (
              <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="font-semibold text-slate-800">超30分钟未处理告警</div>
                  <div className="text-xs text-slate-500">请及时关注处理进度</div>
                </div>
                <div className="max-h-80 overflow-auto">
                  {reminders.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">暂无超时告警</div>
                  ) : (
                    reminders.slice(0, 10).map((r) => (
                      <Link
                        key={r.id}
                        to={`/alerts`}
                        onClick={() => setShowBell(false)}
                        className="flex gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                      >
                        <div
                          className={
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' +
                            (r.level === 'critical'
                              ? 'bg-danger-100 text-danger-700'
                              : r.level === 'warning'
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-primary-100 text-primary-700')
                          }
                        >
                          <AlertTriangle size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-800">
                              {r.title}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {r.zoneName} · {r.deviceName}
                          </div>
                          <div className="mt-1 text-xs text-danger-600">
                            已等待 {r.waitingMinutes} 分钟
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <Link
                  to="/alerts"
                  onClick={() => setShowBell(false)}
                  className="block border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-primary-700 hover:bg-slate-100"
                >
                  查看全部告警
                </Link>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
