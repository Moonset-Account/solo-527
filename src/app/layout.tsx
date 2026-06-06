import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '企业访客与会议室联动系统',
  description: '企业访客管理与会议室预约联动系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getCurrentUser();

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
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
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{user.name}</span>
                    <span className="ml-2 badge badge-info">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t py-6">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
              © 2024 企业访客与会议室联动系统
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
