import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Droplets, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useFilterStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(username, password);
    if (success) {
      navigate('/');
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-800 mb-2">
            河流水质监测系统
          </h1>
          <p className="text-slate-500">地方研究团队日常复盘平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">账号登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                '登录系统'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">快速体验账号（密码均为 password123）:</p>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('admin', 'password123')}
                className="w-full text-left text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-slate-700">admin</span>
                <span className="text-slate-500 ml-2">- 管理员（查看全部数据）</span>
              </button>
              <button
                onClick={() => handleQuickLogin('researcher1', 'password123')}
                className="w-full text-left text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-slate-700">researcher1</span>
                <span className="text-slate-500 ml-2">- 市环境监测中心站</span>
              </button>
              <button
                onClick={() => handleQuickLogin('researcher2', 'password123')}
                className="w-full text-left text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-slate-700">researcher2</span>
                <span className="text-slate-500 ml-2">- 水文水资源勘测局</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 河流水质监测系统 - 仅供内部研究使用
        </p>
      </div>
    </div>
  );
}
