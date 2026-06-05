import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Landmark, Scroll, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] bg-museum-radial relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30" />
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-museum-light/10 rounded-full blur-3xl" />
          <div className="absolute top-[60%] left-[40%] w-48 h-48 bg-gold/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Landmark size={24} className="text-gold" />
              </div>
              <span className="text-3xl font-serif font-bold text-white tracking-wide">博研通</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-serif font-bold text-white leading-tight mb-6">
              博物馆研学<br />活动报名平台
            </h1>
            <p className="text-lg text-museum-50/60 leading-relaxed max-w-md">
              将申请、审核、执行与复盘串联闭环，让每一场研学活动从策划到落地井然有序。
            </p>
          </div>

          <div className="gold-accent-line w-48 mb-10" />

          <div className="space-y-6">
            <div className="flex items-start gap-4 slide-left stagger-1">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Scroll size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">智能排班与冲突检测</p>
                <p className="text-sm text-museum-50/50">自动检测讲解员时间重叠，杜绝排班冲突</p>
              </div>
            </div>
            <div className="flex items-start gap-4 slide-left stagger-2">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">角色化工作台</p>
                <p className="text-sm text-museum-50/50">不同角色进入系统看到专属功能入口与待办提醒</p>
              </div>
            </div>
            <div className="flex items-start gap-4 slide-left stagger-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">全流程闭环管理</p>
                <p className="text-sm text-museum-50/50">从报名到签到、反馈到复盘，每个节点可追溯</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-ivory relative">
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-museum flex items-center justify-center">
              <Landmark size={20} className="text-gold" />
            </div>
            <span className="text-2xl font-serif font-bold text-museum">博研通</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-museum/5 border border-gray-100/80 p-8 card-appear">
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-museum mb-2">欢迎登录</h2>
              <p className="text-sm text-slate-400">输入您的账号以访问管理平台</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-museum text-white font-medium hover:bg-museum-light active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md shadow-museum/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : '登 录'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-slate-400 text-center mb-3">测试账号快速登录</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '管理员', user: 'admin', pass: 'admin123', role: 'admin' },
                  { label: '管理者', user: 'manager1', pass: 'manager123', role: 'manager' },
                  { label: '讲解员', user: 'guide1', pass: 'guide123', role: 'guide' },
                  { label: '学校', user: 'school1', pass: 'school123', role: 'school' },
                ].map((acc) => (
                  <button
                    key={acc.user}
                    onClick={() => { setUsername(acc.user); setPassword(acc.pass); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-museum-50 text-xs text-slate-500 hover:text-museum transition-all duration-200 border border-transparent hover:border-museum/10"
                  >
                    <span className="font-medium text-museum">{acc.label}</span>
                    <span className="text-slate-400">{acc.user}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            博物馆研学活动报名平台 · 博研通 v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
