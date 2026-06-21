import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "病历随访台 · 中医馆复诊提醒平台",
  description:
    "连接前台操作与后台审核的中医馆复诊随访管理系统，助力运营负责人高效管理病历、随访任务、复诊统计与号源利用。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-cream-100 text-ink-900 antialiased">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
