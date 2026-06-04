import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "乡镇农机共享调度平台",
  description: "乡镇农机共享调度平台 - 作业预约、路线派发、油料登记、维修暂停、收益结算",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
