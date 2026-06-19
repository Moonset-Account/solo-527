import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: '装修设计图纸进度看板',
  description: '装修项目全生命周期管理系统 - 进度、预算、质量、售后一站式管控',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased text-zinc-900 bg-zinc-50">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
