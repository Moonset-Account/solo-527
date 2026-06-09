import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { mockUsers } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const demoAccounts = [
  { email: 'admin@demo.com', name: '系统管理员', role: 'admin', desc: '全部权限' },
  { email: 'manager@demo.com', name: '项目经理', role: 'manager', desc: '项目管理' },
  { email: 'reviewer@demo.com', name: '质量审核员', role: 'reviewer', desc: '评估+用户管理' },
  { email: 'zhangsan@demo.com', name: '张三', role: 'member', desc: '普通成员' },
  { email: 'zhaoliu@demo.com', name: '赵六', role: 'member', desc: '普通成员' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const user = mockUsers.find((u) => u.email === email);
      if (!user || password !== '123456') {
        throw new Error('邮箱或密码错误');
      }
      const token = `mock-jwt-${user.id}-${Date.now()}`;
      login(token, user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword('123456');
    setTimeout(() => handleSubmit(new Event('submit') as unknown as React.FormEvent), 100);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f1e4d] via-[#1e3a8a] to-[#2563eb]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-accent-500 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative z-10 h-full w-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center shadow-xl shadow-accent-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold">MeetingMind</div>
              <div className="text-sm text-blue-200">会议行动项智能提取平台</div>
            </div>
          </div>

          <div className="space-y-8 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              AI 赋能会议效率
              <br />
              <span className="bg-gradient-to-r from-accent-400 to-amber-300 bg-clip-text text-transparent">
                让行动项自动浮现
              </span>
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed">
              基于大语言模型的会议转写智能分析，自动提取行动项、负责人、截止日期，支持人工校对、置信度评估与模型持续优化。
            </p>

            <div className="space-y-3">
              {[
                '高精度字段级置信度评估',
                '证据链溯源，每一条都有据可依',
                '完整版本历史与回滚机制',
                '模型 Fine-tuning 闭环',
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-accent-400 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-blue-300/60">
            © 2026 MeetingMind · 企业级智能会议管理
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">MeetingMind</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">欢迎回来 👋</h1>
            <p className="text-slate-500 text-sm">登录以继续使用智能会议管理平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full h-11 pl-11 pr-11 rounded-xl border border-slate-200 bg-white text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              )}
            >
              {loading ? '登录中...' : '登 录'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-slate-50 text-slate-500">演示账号快速登录</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc)}
                  className="group w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm transition-all text-left"
                >
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0',
                    acc.role === 'admin' && 'bg-gradient-to-br from-rose-500 to-pink-600',
                    acc.role === 'manager' && 'bg-gradient-to-br from-primary-500 to-primary-700',
                    acc.role === 'reviewer' && 'bg-gradient-to-br from-violet-500 to-purple-600',
                    acc.role === 'member' && 'bg-gradient-to-br from-slate-500 to-slate-700'
                  )}>
                    {acc.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{acc.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">{acc.desc}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">{acc.email}</div>
                  </div>
                  <span className="text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-center text-slate-400">
              所有演示账号密码均为 <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
