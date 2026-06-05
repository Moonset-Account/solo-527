import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: '校园戏剧社管理系统',
  description: '校园戏剧社排练和票务管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={cn('min-h-screen bg-gray-50 font-sans antialiased')}>
        {children}
      </body>
    </html>
  );
}
