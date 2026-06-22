import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../store/auth';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    const accounts: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: '123456' },
      staff: { username: 'staff', password: '123456' },
      coach: { username: 'coach', password: '123456' },
      manager: { username: 'manager', password: '123456' },
    };

    const acc = accounts[role];
    if (acc) {
      setUsername(acc.username);
      setPassword(acc.password);
      setLoading(true);
      try {
        await login(acc.username, acc.password);
        navigate({ to: '/' });
      } catch (err: any) {
        setError(err.response?.data?.error || '登录失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏊</div>
          <h1 className="text-2xl font-bold text-gray-800">游泳馆设备巡检管理系统</h1>
          <p className="text-gray-500 mt-2">请登录您的账户</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:bg-primary-300 transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">快捷登录（演示账户）</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => quickLogin('admin')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              管理员
            </button>
            <button
              onClick={() => quickLogin('staff')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              前台
            </button>
            <button
              onClick={() => quickLogin('coach')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              教练主管
            </button>
            <button
              onClick={() => quickLogin('manager')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              负责人
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
