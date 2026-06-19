import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/app-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '合同审查节点提醒系统',
  description: '法务合同审查与节点提醒管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
