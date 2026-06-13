import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "销售经营异常监控台",
  description: "实时追踪销售核心指标异常，智能告警，快速定位原因",
};

function isClerkConfigured(): boolean {
  if (typeof process === "undefined") return false;
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!key && !key.startsWith("pk_test_xxx");
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkEnabled = isClerkConfigured();

  const content = (
    <TRPCReactProvider>{children}</TRPCReactProvider>
  );

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {clerkEnabled ? (
          <ClerkProvider>{content}</ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
