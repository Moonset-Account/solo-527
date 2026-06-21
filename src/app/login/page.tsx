'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Package, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (session && status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [session, status, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-industrial-dark via-primary-900 to-industrial-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-industrial-dark via-primary-900 to-industrial-dark relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-warning/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-glow mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">汽配门店驾驶舱</h1>
          <p className="text-white/60">统一流程 · 精准管控 · 数据驱动</p>
        </div>

        <Card className="p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-metal-900 mb-6">欢迎回来</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              placeholder="请输入邮箱"
              required
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              placeholder="请输入密码"
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              登录系统
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-metal-200">
            <p className="text-xs text-metal-500 text-center mb-3">演示账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-metal-50 rounded-lg">
                <p className="font-medium text-metal-700">店长</p>
                <p className="text-metal-500">admin@example.com</p>
              </div>
              <div className="p-2 bg-metal-50 rounded-lg">
                <p className="font-medium text-metal-700">前台</p>
                <p className="text-metal-500">reception@example.com</p>
              </div>
              <div className="p-2 bg-metal-50 rounded-lg">
                <p className="font-medium text-metal-700">技师</p>
                <p className="text-metal-500">tech@example.com</p>
              </div>
              <div className="p-2 bg-metal-50 rounded-lg">
                <p className="font-medium text-metal-700">库管</p>
                <p className="text-metal-500">store@example.com</p>
              </div>
            </div>
            <p className="text-xs text-metal-400 text-center mt-3">默认密码：admin123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
