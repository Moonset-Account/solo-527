import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '阳光助学计划',
  description: '每一份爱心，点亮一个未来。公益助学项目公开透明平台，展示项目进展、资金使用和受助反馈。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
