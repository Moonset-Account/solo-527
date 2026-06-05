import type { Metadata } from "next";
import { Oswald, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import Header from './components/Header';

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "城市篮球联赛管理系统",
  description: "专业的业余篮球联赛管理平台 - 球队报名、赛程安排、比分录入、积分榜、申诉处理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${oswald.variable} ${notoSansSC.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-secondary-dark text-white/80 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="font-display font-bold">城市篮球联赛管理系统</span>
              </div>
              <p className="text-sm text-white/50">
                © 2024 城市篮球联赛组委会. 保留所有权利.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
