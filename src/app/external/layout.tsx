"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LoginForm } from "@/components/LoginForm";
import { ToastProvider } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";

export default function ExternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold text-center mb-8">
              乡镇农机共享调度平台 - 农户入口
            </h1>
            <LoginForm redirectTo="/external" />
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar type="external" />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
