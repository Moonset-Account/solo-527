import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SaaS 计费台 - 订阅管理平台',
  description: '为 SaaS 创始人打造的订阅套餐计费管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={cn(inter.variable, spaceGrotesk.variable)}>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {children}
      </body>
    </html>
  );
}
