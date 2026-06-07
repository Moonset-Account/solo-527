import type { Metadata } from "next";
import { TrpcProvider } from "@/components/providers/trpc-provider";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "候补转化看板",
  description: "课程报名候补转化分析仪表盘",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="h-full flex">
        <TrpcProvider>
          <Sidebar />
          <main className="flex-1 h-screen overflow-auto">{children}</main>
        </TrpcProvider>
      </body>
    </html>
  );
}
