import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Package, User, Award, Settings } from 'lucide-react';

export const Route = createFileRoute('/my')({
  component: MyLayout,
});

function MyLayout() {
  const location = useLocation();
  const { isAuthenticated, role, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || role !== 'member') {
      window.location.href = '/login';
    }
  }, [isAuthenticated, role]);

  if (!isAuthenticated || role !== 'member') {
    return null;
  }

  const member = user as any;

  const navItems = [
    { path: '/my/orders', icon: Package, label: '兑换记录' },
    { path: '/my/profile', icon: User, label: '个人中心' },
    { path: '/my/levels', icon: Award, label: '会员等级' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{member?.nickname || '会员'}</h2>
            <p className="text-brand-100 text-sm mt-1">
              可用积分：<span className="font-semibold text-white text-lg">{member?.points || 0}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <div className="bg-white rounded-2xl p-2 shadow-soft">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
