import type { Metadata } from "next";
import { Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "中医馆病历随访系统",
  description: "中医馆病历随访管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSerifSC.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <AppProvider>
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-auto">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
