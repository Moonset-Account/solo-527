import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignIn,
  SignedOut,
  SignedIn,
} from "@clerk/nextjs";
import { TRPCProvider } from "./providers";
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
  title: "宿舍报修交易担保台",
  description: "宿舍报修、二手交易、举报退款一站式管理平台",
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
        <body className="min-h-full flex flex-col">
          <SignedOut>
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <SignIn routing="hash" />
            </div>
          </SignedOut>
          <SignedIn>
            <TRPCProvider>{children}</TRPCProvider>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
