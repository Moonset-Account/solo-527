import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Route, 
  Truck, 
  TrendingUp, 
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/stations', label: '站点分析', icon: MapPin },
  { path: '/routes', label: '线路分析', icon: Route },
  { path: '/dispatch', label: '调度管理', icon: Truck },
  { path: '/forecast', label: '预测中心', icon: TrendingUp },
  { path: '/data', label: '数据管理', icon: Database },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { lastUpdateTime, etlWarnings } = useDashboardStore();

  const formatTime = (ts: number) => {
    if (!ts) return '数据加载中...';
    return new Date(ts).toLocaleString('zh-CN');
  };

  const hasWarnings = etlWarnings.length > 0;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-dark-card/50 border-r border-dark-border flex flex-col">
        <div className="p-5 border-b border-dark-border">
          <h1 className="font-display text-xl font-bold bg-gradient-to-r from-accent-cyan to-blue-400 bg-clip-text text-transparent">
            单车调度分析
          </h1>
          <p className="text-xs text-gray-500 mt-1">城市出行运营工作台</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={isActive ? 'nav-item-active' : 'nav-item'}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <RefreshCw size={12} className={lastUpdateTime ? 'text-emerald-400' : 'text-gray-500 animate-spin'} />
            数据更新: {formatTime(lastUpdateTime)}
          </div>
          {hasWarnings && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20">
              <AlertTriangle size={12} />
              <span>{etlWarnings.length} 条数据警告</span>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {hasWarnings && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <AlertTriangle size={16} />
              <span>数据提示：</span>
              <span className="text-amber-200">{etlWarnings[0]}</span>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
