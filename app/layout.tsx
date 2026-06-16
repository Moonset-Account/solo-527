import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';
import { TRPCProvider } from '@/components/providers/trpc-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '合规清单台 - 数据合规风险看板',
  description: '企业级数据合规风险管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body className={inter.className}>
          <TRPCProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
