'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Phone, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { cn } from '@/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();
  const [role, setRole] = useState<UserRole>('resident');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      document.cookie = `auth_user=${JSON.stringify(user)}; path=/`;
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/resident');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(phone, role);
      if (success) {
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          document.cookie = `auth_user=${JSON.stringify(authUser)}; path=/`;
          if (role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/resident');
          }
        }
      } else {
        setError('登录失败，请检查手机号和角色是否正确');
      }
    } catch (err) {
      setError('登录时发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'resident' as UserRole, phone: '13800138002', name: '李居民（居民代表）' },
    { role: 'admin' as UserRole, phone: '13800138001', name: '张管理员' },
  ];

  const handleQuickLogin = async (account: typeof demoAccounts[0]) => {
    setRole(account.role);
    setPhone(account.phone);
    setLoading(true);
    setError('');

    try {
      const success = await login(account.phone, account.role);
      if (success) {
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          document.cookie = `auth_user=${JSON.stringify(authUser)}; path=/`;
          if (account.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/resident');
          }
        }
      } else {
        setError('快速登录失败');
      }
    } catch (err) {
      setError('登录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">网格事件台</h1>
          <p className="text-primary-200">居民议题台账管理系统</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up animate-stagger-1">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setRole('resident')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                role === 'resident'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Users className="w-4 h-4 inline mr-2" />
              居民代表
            </button>
            <button
              onClick={() => setRole('admin')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                role === 'admin'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              管理员
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone">手机号</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">演示环境密码任意</p>
            </div>

            {error && (
              <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-3">快速登录演示账号：</p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.phone}
                  onClick={() => handleQuickLogin(account)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-700">{account.name}</p>
                      <p className="text-xs text-slate-500">{account.phone}</p>
                    </div>
                  </div>
                  <span className="text-primary-600 text-sm">登录 →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/20 blur-xl rounded-full" />
      </div>
    </div>
  );
}
