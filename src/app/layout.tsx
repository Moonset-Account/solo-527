import type { Metadata } from 'next';
import './globals.css';
import AppLayout from './AppLayout';

export const metadata: Metadata = {
  title: '医院药房取药瓶颈分析平台',
  description: '药房运营改善组分析工作台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
