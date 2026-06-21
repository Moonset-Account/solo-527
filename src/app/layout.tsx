import { type Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN as clerkZhCN } from "@clerk/localizations";
import type { Localization } from "@clerk/types";

import { TRPCReactProvider } from "@/trpc/react";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "租后服务中心",
  description: "联合办公房源租后服务管理平台",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={clerkZhCN as Localization}>
      <html lang="zh-CN" className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <body className={cn("min-h-screen bg-slate-50 font-sans antialiased")}>
          <TRPCReactProvider cookies={cookies().toString()}>
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
