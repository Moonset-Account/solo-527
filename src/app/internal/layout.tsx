"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LoginForm } from "@/components/LoginForm";
import { ToastProvider } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isInternal } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold text-center mb-8">
              乡镇农机共享调度平台 - 管理入口
            </h1>
            <LoginForm redirectTo="/internal" />
          </div>
        </div>
      </ToastProvider>
    );
  }

  if (!isInternal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-500 mb-4">您没有权限访问管理后台</p>
          <a href="/" className="text-primary-600 hover:underline">
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar type="internal" />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
