'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CurrentUser, getCurrentUser } from '@/lib/auth';
import UserSwitcher from './UserSwitcher';

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary-600">
              访客会议系统
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                首页
              </Link>
              <Link href="/meetings" className="text-gray-700 hover:text-primary-600 transition-colors">
                会议管理
              </Link>
              <Link href="/calendar" className="text-gray-700 hover:text-primary-600 transition-colors">
                会议室日历
              </Link>
              <Link href="/visitors" className="text-gray-700 hover:text-primary-600 transition-colors">
                访客管理
              </Link>
              {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                <Link href="/front-desk" className="text-gray-700 hover:text-primary-600 transition-colors">
                  前台工作台
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link href="/audit" className="text-gray-700 hover:text-primary-600 transition-colors">
                  审计日志
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <UserSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
