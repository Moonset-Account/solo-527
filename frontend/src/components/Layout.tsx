import { component$, useStylesScoped$, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "~/context/auth";

interface LayoutProps {
  title?: string;
}

export default component$<LayoutProps>(({ title }) => {
  const auth = useAuth();
  const nav = useNavigate();
  
  useStylesScoped$(`
    .sidebar {
      width: 250px;
      min-height: 100vh;
    }
    .nav-item {
      transition: all 0.2s;
    }
    .nav-item:hover {
      background-color: rgba(34, 197, 94, 0.1);
    }
    .nav-item.active {
      background-color: rgba(34, 197, 94, 0.15);
      color: #16a34a;
      border-right: 3px solid #22c55e;
    }
  `);

  const handleLogout = $(async () => {
    await auth.logout();
    nav.navigate('/login');
  });

  const menuItems = [
    { path: '/dashboard', label: '仪表板', icon: '📊', roles: ['member', 'operator', 'admin'] },
    { path: '/equipment', label: '设备管理', icon: '🚜', roles: ['member', 'operator', 'admin'] },
    { path: '/fields', label: '地块管理', icon: '🌾', roles: ['member', 'admin'] },
    { path: '/reservations', label: '预约管理', icon: '📅', roles: ['member', 'operator', 'admin'] },
    { path: '/work', label: '作业任务', icon: '👷', roles: ['operator', 'admin'] },
    { path: '/maintenance', label: '维修工单', icon: '🔧', roles: ['operator', 'admin'] },
    { path: '/settlement', label: '结算管理', icon: '💰', roles: ['member', 'admin'] },
    { path: '/audit', label: '审计日志', icon: '📋', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    auth.user?.role && item.roles.includes(auth.user.role)
  );

  return (
    <div class="flex">
      <aside class="sidebar bg-white border-r border-gray-100 shadow-sm">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white text-xl">
              🌾
            </div>
            <div>
              <h1 class="font-bold text-gray-800">农机共享平台</h1>
              <p class="text-xs text-gray-500">农业合作社</p>
            </div>
          </div>
        </div>

        <nav class="p-4">
          <ul class="space-y-1">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-primary-600"
                >
                  <span class="text-xl">{item.icon}</span>
                  <span class="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div class="flex items-center gap-3 mb-4 px-2">
            <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              {auth.user?.name?.charAt(0) || '?'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-800 truncate">{auth.user?.name}</p>
              <p class="text-xs text-gray-500">
                {auth.user?.role === 'admin' && '管理员'}
                {auth.user?.role === 'member' && '社员'}
                {auth.user?.role === 'operator' && '机手'}
                {' · '}
                {auth.user?.points} 积分
              </p>
            </div>
          </div>
          <button 
            onClick$={handleLogout}
            class="w-full btn-secondary text-sm"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main class="flex-1 min-h-screen bg-gray-50">
        <header class="bg-white border-b border-gray-100 px-8 py-4">
          <h2 class="text-xl font-bold text-gray-800">{title || '农业合作社农机共享平台'}</h2>
        </header>
        <div class="p-8">
          <Slot />
        </div>
      </main>
    </div>
  );
});
