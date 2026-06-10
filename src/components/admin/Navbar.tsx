'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { getAllPhotos, getAllExceptions } from '@/lib/services/data';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';
import type { Photo, ExceptionRecord } from '@/lib/types';

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [openExceptions, setOpenExceptions] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      getAllPhotos('pending'),
      getAllExceptions(),
    ]).then(([photos, exceptions]) => {
      setPendingCount((photos as Photo[]).length);
      setOpenExceptions((exceptions as ExceptionRecord[]).filter(e => e.status !== 'closed').length);
    });
  }, [isAuthenticated]);

  const totalAlerts = pendingCount + openExceptions;

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 w-80">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="bg-transparent w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/exceptions"
              className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalAlerts}
                </span>
              )}
            </Link>

            {pendingCount > 0 && (
              <Link
                href="/admin/photos"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 hover:bg-yellow-100 transition-colors"
              >
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                {pendingCount} 张照片待审核
              </Link>
            )}

            {openExceptions > 0 && (
              <Link
                href="/admin/exceptions"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 hover:bg-red-100 transition-colors"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {openExceptions} 个异常待处理
              </Link>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white p-4 space-y-2">
          {pendingCount > 0 && (
            <Link
              href="/admin/photos"
              className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700"
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              {pendingCount} 张照片待审核
            </Link>
          )}
          {openExceptions > 0 && (
            <Link
              href="/admin/exceptions"
              className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {openExceptions} 个异常待处理
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
