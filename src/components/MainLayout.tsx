import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Activity, BarChart3, TrendingUp, Users, FileText, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore } from '../store';
import { DataQualityBanner } from '../components/DataQualityBanner';
import { useDataQuality, useRefreshData } from '../hooks/useData';
import { useFilterStore } from '../store';

const NAV_ITEMS = [
  { path: '/dashboard', label: '仪表盘', icon: BarChart3 },
  { path: '/workload', label: '负荷分析', icon: TrendingUp },
  { path: '/compare', label: '对比分析', icon: Users },
  { path: '/recovery', label: '恢复监测', icon: Activity },
  { path: '/reports', label: '报告中心', icon: FileText },
];

const COACH_NAV_ITEMS = [
  { path: '/injury', label: '伤病管理', icon: Activity },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isCoach = useAuthStore((s) => s.isCoach());
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const filters = useFilterStore((s) => s.filters);
  const { data: dataQuality } = useDataQuality();
  const refreshData = useRefreshData();

  const allNavItems = isCoach ? [...NAV_ITEMS, ...COACH_NAV_ITEMS] : NAV_ITEMS;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -280,
          width: 280,
        }}
        className={`fixed lg:static z-50 h-screen bg-surface-lighter/95 backdrop-blur-xl border-r border-white/10 flex flex-col`}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">训练负荷平台</h1>
              <p className="text-xs text-slate-500">Training Load Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {isCoach ? '教练组' : '队员'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="font-display text-lg font-semibold text-white">
              {allNavItems.find((i) => i.path === location.pathname)?.label || '仪表盘'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </div>
          </div>

          {dataQuality && (
            <DataQualityBanner
              status={dataQuality}
              onRefresh={refreshData}
            />
          )}
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
