'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { LogIn, AlertCircle } from 'lucide-react';

const AUTH_COOKIE_NAME = 'weekly-meeting-dashboard-store';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((state) => state.login);
  const currentUser = useStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      const value = JSON.stringify({ state: { currentUser }, version: 0 });
      document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      router.push('/');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email);
      if (!success) {
        setError('邮箱不存在，请使用以下测试账号：admin@company.com、hr@company.com、emp1@company.com');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-primary-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">周会事项看板</h1>
            <p className="text-gray-500">请登录以继续使用系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入您的邮箱"
                className="input"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full btn-primary py-3 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2 font-medium">测试账号：</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">管理员：</span>admin@company.com</p>
              <p><span className="font-medium">部门主管：</span>hr@company.com</p>
              <p><span className="font-medium">普通用户：</span>emp1@company.com</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          © 2024 周会事项看板系统 · 行政办公专用
        </p>
      </div>
    </div>
  );
}
