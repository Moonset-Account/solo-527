import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";

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
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
