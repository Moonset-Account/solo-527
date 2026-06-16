'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '@/lib/store';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, isLoading, supabaseError, initialize } = useAppStore();
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    const run = async () => {
      try {
        setInitError(null);
        await initialize();
      } catch (e: any) {
        setInitError(e?.message || '初始化数据失败');
      }
    };
    run();
  }, [currentUser, router, initialize, retryCount]);

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        <div className="text-gray-500 text-sm">正在从数据库加载数据...</div>
      </div>
    );
  }

  const error = initError || supabaseError;
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">数据库连接失败</div>
              <div className="text-xs text-red-500 mt-0.5">请检查 .env.local 配置并执行建表脚本</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono break-all">
            {error}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>1. 确认 <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> 已填写真实 Supabase 配置</div>
            <div>2. 执行 <code className="bg-gray-100 px-1 py-0.5 rounded">npm run db:init</code> 建表</div>
            <div>3. 执行 <code className="bg-gray-100 px-1 py-0.5 rounded">npm run db:seed</code> 加载种子数据</div>
            <div>4. 执行 <code className="bg-gray-100 px-1 py-0.5 rounded">npm run db:check</code> 验证</div>
          </div>
          <Button
            className="w-full"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => { setInitError(null); setRetryCount((c) => c + 1); }}
          >
            重新连接
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">{children}</main>
      </div>
    </div>
  );
}
