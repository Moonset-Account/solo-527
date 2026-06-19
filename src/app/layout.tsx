import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/trpc/TRPCProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "办公耗材交付对账系统",
  description: "采购办公耗材对账、供应商风险管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="zh-CN"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <TRPCProvider>{children}</TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
