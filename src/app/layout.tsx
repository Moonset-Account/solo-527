import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '装修线索跟进管道系统',
  description: '装修行业销售线索全生命周期管理平台',
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
