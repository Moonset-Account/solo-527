import type { Metadata } from "next";
import { TrpcProvider } from "@/lib/providers/TrpcProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "客服排班负载看板",
  description: "智能客服排班管理与负载监控平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
