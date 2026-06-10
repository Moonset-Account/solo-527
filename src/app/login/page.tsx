'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/useAuthStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, checkAuth, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoginError('');
    const success = await login(data.email, data.password);
    if (success) {
      router.push('/admin');
    } else {
      setLoginError('登录失败，请检查邮箱和密码。（测试账号：admin@charity.org / officer@charity.org）');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-primary-500 fill-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-serif">项目管理后台</h1>
          <p className="text-white/80">阳光助学计划 · 管理登录</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="邮箱地址"
              type="email"
              icon={LogIn}
              placeholder="请输入您的邮箱"
              error={errors.email?.message}
              {...register('email', {
                required: '请输入邮箱地址',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址',
                },
              })}
            />

            <div className="relative">
              <Input
                label="登录密码"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入您的密码"
                error={errors.password?.message}
                {...register('password', {
                  required: '请输入密码',
                  minLength: {
                    value: 6,
                    message: '密码至少6位',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={isSubmitting}
              icon={LogIn}
            >
              {isSubmitting ? '登录中...' : '登录管理后台'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-warm-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2 font-medium">测试账号：</p>
            <p className="text-xs text-gray-500">管理员：admin@charity.org</p>
            <p className="text-xs text-gray-500">项目官：officer@charity.org</p>
            <p className="text-xs text-gray-500">密码：任意6位以上即可</p>
          </div>
        </div>
      </div>
    </div>
  );
}
