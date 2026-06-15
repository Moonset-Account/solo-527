'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck2, Loader2, Lock, User2, Building2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast('请输入用户名和密码', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast('登录成功，欢迎回来！', 'success');
      const redirect = searchParams.get('redirect');
      setTimeout(() => router.push(redirect || '/'), 300);
    } catch (err: any) {
      toast(err.message || '登录失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { user: 'admin', pwd: 'admin123', role: '系统管理员' },
    { user: 'lead', pwd: 'lead123', role: '行政负责人' },
    { user: 'zhangsan', pwd: 'user123', role: '普通用户' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f1f33] via-[#1e3a5f] to-[#2d5a8f]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-sky-500 blur-3xl opacity-40" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-400 blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <CalendarCheck2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-wide">
                周会事项提醒中心
              </div>
              <div className="text-xs text-white/60 mt-0.5">
                Weekly Meeting Reminder Center
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                让每一项周会议定事项
                <br />
                <span className="text-gradient-brand bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  都有清晰的归属与追踪
                </span>
              </h1>
              <p className="text-white/70 text-base max-w-md leading-relaxed">
                从待办派发、认领跟进、进度补充到催办归档，全流程线上化。
                减少跨页面跳转，高频字段显性化，责任归属一目了然。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-5 max-w-lg">
              <FeatureCard title="进度实时跟进" desc="少跳转，多更新" icon="check" />
              <FeatureCard title="智能催办提醒" desc="按规则自动发送" icon="bell" />
              <FeatureCard title="完整审计追踪" desc="责任变更全留痕" icon="shield" />
            </div>
          </div>

          <div className="text-sm text-white/50 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>© 2025 企业内部管理平台 · 信息安全保障</span>
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-md">
          {/* 移动端品牌 */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <CalendarCheck2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">
                周会事项提醒中心
              </div>
              <div className="text-xs text-slate-500">Weekly Meeting Reminder</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              欢迎登录
            </h2>
            <p className="text-slate-500">
              请使用您的企业账号登录以继续
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label-base">账号</label>
              <div className="relative">
                <User2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="input-base pl-11"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label-base">密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-base pl-11"
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit(e as any)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  defaultChecked
                />
                记住我
              </label>
              <a className="text-primary hover:text-primary-light font-medium">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'btn-primary w-full py-3 text-base mt-4',
                'bg-gradient-to-r from-primary to-primary-light hover:shadow-lg hover:shadow-primary/25'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          {/* 演示账号 */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
              演示账号（可直接点击填入）
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.user}
                  type="button"
                  onClick={() => {
                    setUsername(acc.user);
                    setPassword(acc.pwd);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-transparent bg-white hover:border-primary/30 hover:bg-primary/5 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary">
                      {acc.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {acc.user}
                      </div>
                      <div className="text-xs text-slate-400">{acc.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{acc.pwd}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: 'check' | 'bell' | 'shield';
}) {
  const icons = {
    check: '✓',
    bell: '🔔',
    shield: '🛡',
  };
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-4">
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg mb-3">
        {icons[icon]}
      </div>
      <div className="text-sm font-semibold text-white mb-1">{title}</div>
      <div className="text-xs text-white/55">{desc}</div>
    </div>
  );
}
