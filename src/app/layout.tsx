import type { Metadata } from 'next';
import { Noto_Sans_SC, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc';
import { AppSidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: '高校实验室大型仪器预约平台',
  description: '整合设备排期、培训资格审核与故障停机管理的统一平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <TRPCProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <main className="p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
