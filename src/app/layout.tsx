import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
  let notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    status: string;
    createdAt: string;
  }> = [];

  try {
    const user = await getCurrentUser();
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    unreadCount = dbNotifications.filter((n) => n.status === "UNREAD").length;
    notifications = dbNotifications.map((n) => ({
      id: n.id,
      type: n.type as string,
      title: n.title,
      message: n.message,
      status: n.status as string,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error("Failed to fetch notification count", e);
  }

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <Navbar unreadCount={unreadCount} notifications={notifications} />
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
