import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '周会事项状态看板',
  description: '周会待办事项跟踪与管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
