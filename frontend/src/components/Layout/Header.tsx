import { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuthStore, useUser } from '@/store/authStore';
import { ROLE_MAP } from '@/utils/constants';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export function Header() {
  const user = useUser();
  const logout = useAuthStore((state) => state.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="搜索工单、客户、订单号..."
            className="w-full h-10 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-zinc-900">{user?.name || '用户'}</p>
              <p className="text-xs text-zinc-500">{user ? ROLE_MAP[user.role]?.label : ''}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg py-2 z-50 fade-in">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-medium text-zinc-900">{user?.name}</p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <Settings className="h-4 w-4" />
                  个人设置
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="确认退出"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              确认退出
            </Button>
          </>
        }
      >
        <p className="text-zinc-600">确定要退出登录吗？</p>
      </Modal>
    </header>
  );
}
