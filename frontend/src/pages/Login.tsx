import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/auth';

const testAccounts = [
  { username: 'admin', password: '123456', name: '系统管理员', role: '管理员' },
  { username: 'manager', password: '123456', name: '张主管', role: '主管' },
  { username: 'product1', password: '123456', name: '李产品', role: '产品经理' },
  { username: 'sales1', password: '123456', name: '王销售', role: '销售' },
  { username: 'finance1', password: '123456', name: '赵财务', role: '财务' },
];

interface LoginForm {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const { login, error, isLoading, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (accessToken) {
      navigate('/dashboard');
    }
  }, [accessToken, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.username, data.password);
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (e) {
      // Error handled in store
    }
  };

  const handleQuickLogin = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
              <TrendingUp size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">旅行定制报价平台</h1>
            <p className="text-slate-300 text-sm mt-2">高效处理半定制路线报价</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">用户名</label>
              <input
                type="text"
                {...register('username', { required: '请输入用户名' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: '请输入密码' })}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-medium rounded-lg transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-slate-400 text-xs mb-3">测试账号快捷登录：</p>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.slice(0, 4).map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleQuickLogin(account.username, account.password)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-colors"
                >
                  <div className="text-white text-sm font-medium">{account.name}</div>
                  <div className="text-slate-400 text-xs">{account.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
