import type { Metadata } from "next";
import { Oswald, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Gavel, 
  Menu, 
  X,
  Wifi,
  WifiOff
} from 'lucide-react';

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
        <header className="bg-gradient-secondary text-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-accent" />
                <Link href="/" className="text-xl font-bold font-display tracking-wider">
                  城市篮球联赛
                </Link>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                <NavLink href="/" icon={<Trophy className="w-4 h-4" />}>首页</NavLink>
                <NavLink href="/teams" icon={<Users className="w-4 h-4" />}>球队</NavLink>
                <NavLink href="/schedule" icon={<Calendar className="w-4 h-4" />}>赛程</NavLink>
                <NavLink href="/standings" icon={<BarChart3 className="w-4 h-4" />}>积分榜</NavLink>
                <NavLink href="/appeals" icon={<Gavel className="w-4 h-4" />}>申诉</NavLink>
              </nav>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 text-xs text-white/70">
                  <Wifi className="w-4 h-4 text-success" />
                  <span>在线</span>
                </div>
                <button className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-secondary-dark text-white/80 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
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

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
    >
      {icon}
      {children}
    </Link>
  );
}
