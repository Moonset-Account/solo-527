import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "问卷样本质量监控系统",
  description: "线上问卷样本质量监控平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
