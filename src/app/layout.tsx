import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "同城骑手轨迹看板 | 调度管理系统",
  description: "面向调度主管的实时运营管理平台，实现订单调度、骑手轨迹监控、履约时效管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-100 bg-grid">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
