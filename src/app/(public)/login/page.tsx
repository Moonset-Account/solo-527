'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, User, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Alert';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, loginAsAdmin, loginAsCustomer } = useAuthStore();
  const [loginType, setLoginType] = useState<'customer' | 'admin'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    const success = await login(email, password);
    if (success) {
      if (loginType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/member');
      }
    }
  };

  const handleQuickLogin = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      loginAsAdmin();
      router.push('/admin');
    } else {
      loginAsCustomer();
      router.push('/member');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-50 to-primary-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-dark-900 font-display">欢迎回来</h1>
          <p className="text-dark-500 mt-1">登录您的账户</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="customer" value={loginType} onValueChange={(v) => setLoginType(v as 'customer' | 'admin')}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="customer" className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  用户登录
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  管理员
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert type="error" title="登录失败">
                      {error}
                    </Alert>
                  )}

                  <Input
                    label="邮箱/手机号"
                    placeholder="请输入邮箱或手机号"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    prefix={<Mail className="h-4 w-4 text-dark-400" />}
                  />

                  <Input
                    label="密码"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    prefix={<Lock className="h-4 w-4 text-dark-400" />}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-dark-600">
                      <input type="checkbox" className="rounded border-dark-300" />
                      记住我
                    </label>
                    <a href="#" className="text-primary-600 hover:text-primary-700">
                      忘记密码？
                    </a>
                  </div>

                  <Button type="submit" fullWidth isLoading={isLoading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    登录
                  </Button>

                  <div className="text-center text-sm text-dark-500">
                    还没有账户？
                    <a href="#" className="text-primary-600 hover:text-primary-700 ml-1">
                      立即注册
                    </a>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert type="error" title="登录失败">
                      {error}
                    </Alert>
                  )}

                  <Input
                    label="管理员账号"
                    placeholder="请输入管理员邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    prefix={<Mail className="h-4 w-4 text-dark-400" />}
                  />

                  <Input
                    label="密码"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    prefix={<Lock className="h-4 w-4 text-dark-400" />}
                  />

                  <Button type="submit" fullWidth isLoading={isLoading}>
                    <Shield className="h-4 w-4 mr-2" />
                    登录管理后台
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-dark-100">
              <p className="text-xs text-center text-dark-400 mb-3">快速体验</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" onClick={() => handleQuickLogin('customer')}>
                  <User className="h-4 w-4 mr-2" />
                  用户演示
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickLogin('admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  管理演示
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
