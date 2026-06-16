'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const quickAccounts = [
  { email: 'admin@deco.com', label: '超级管理员', role: 'super_admin' },
  { email: 'manager1@deco.com', label: '销售经理', role: 'sales_manager' },
  { email: 'c1@deco.com', label: '销售顾问', role: 'sales_consultant' },
  { email: 'a1@deco.com', label: '数据分析员', role: 'analyst' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, users } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email);
      if (success) {
        router.push('/');
      } else {
        setError('账号不存在，请使用下方快速登录账号');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-16 h-full text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold">
                装
              </div>
              <div>
                <div className="text-xl font-bold">装修线索管道</div>
                <div className="text-sm text-white/60">Decoration Lead CRM</div>
              </div>
            </div>
          </div>
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              让每一条装修线索
              <br />
              <span className="text-accent-400">都不被错过</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              从公海池分配到成交归档，全流程可视化跟进，自动回收超期线索，数据驱动成交决策，让销售团队效率倍增。
            </p>
            <div className="space-y-3">
              {[
                '8 阶段跟进管道，一目了然',
                '自动回收机制，杜绝线索浪费',
                '成交预测看板，数据驱动决策',
                '变更时间轴，轻松交接不遗漏',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-accent-400 shrink-0" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-sm text-white/40">© 2025 Decoration CRM. All rights reserved.</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
              装
            </div>
            <span className="font-bold text-gray-900">装修线索管道</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来 👋</h2>
          <p className="text-gray-500 text-sm mb-8">登录账号开始管理你的装修线索</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱账号</label>
              <Input
                type="email"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">登录密码</label>
              <Input
                type="password"
                placeholder="请输入密码（演示环境任意密码）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
              登录系统
            </Button>
          </form>

          <div className="mt-8">
            <div className="text-xs text-gray-400 mb-3 text-center">快速体验（点击切换角色）</div>
            <div className="grid grid-cols-2 gap-2">
              {quickAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setEmail(acc.email)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all duration-200',
                    email === acc.email
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="text-sm font-medium text-gray-900">{acc.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
