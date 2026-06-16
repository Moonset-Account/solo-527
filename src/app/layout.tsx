import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "客服会话知识检索助手",
  description: "智能客服知识检索与质量监控系统",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let unreadCount = 0;
  try {
    const user = await getCurrentUser();
    unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        status: "UNREAD",
      },
    });
  } catch (e) {
    console.error("Failed to fetch notification count", e);
  }

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar unreadCount={unreadCount} />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            © 2026 客服会话知识检索助手 | Powered by Next.js + Prisma + PostgreSQL + Redis
          </div>
        </footer>
      </body>
    </html>
  );
}
