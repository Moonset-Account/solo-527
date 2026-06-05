import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type LoginRole = 'member' | 'operator' | 'admin';

const demoAccounts = [
  { username: 'admin', password: '123456', name: '张管理员', role: 'admin' as const },
  { username: 'member1', password: '123456', name: '李社员', role: 'member' as const },
  { username: 'member2', password: '123456', name: '王社员', role: 'member' as const },
  { username: 'member3', password: '123456', name: '赵社员', role: 'member' as const },
  { username: 'operator1', password: '123456', name: '刘机手', role: 'operator' as const },
  { username: 'operator2', password: '123456', name: '陈机手', role: 'operator' as const },
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>('admin');

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account: typeof demoAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setSelectedRole(account.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-soil-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-lg shadow-primary-200">
            🌾
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">农业合作社</h1>
          <p className="text-gray-500">农机共享管理平台</p>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6">
            {(['admin', 'member', 'operator'] as LoginRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedRole === role
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'admin' && '管理员'}
                {role === 'member' && '社员'}
                {role === 'operator' && '机手'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">演示账号快捷登录：</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts
                .filter(a => a.role === selectedRole)
                .map((account) => (
                  <button
                    key={account.username}
                    onClick={() => quickLogin(account)}
                    className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                  >
                    <div className="font-medium text-gray-700">{account.name}</div>
                    <div className="text-xs text-gray-400">{account.username}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          默认密码：123456
        </p>
      </div>
    </div>
  );
}
