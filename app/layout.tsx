import type { Metadata } from 'next';
import './globals.css';
import ShellProvider from '@/components/ShellProvider';

export const metadata: Metadata = {
  title: '汽配门店业务协同台',
  description: '面向汽配门店店长的一站式业务协同管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}
