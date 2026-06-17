import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from '@clerk/localizations'
import './globals.css'
import { TRPCProvider } from '@/trpc/provider'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '居民议题协商投票站',
  description: '居民代表议题协商、投票、设施管理、志愿服务一站式平台',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider localization={zhCN}>
      <html lang="zh-CN" className={`${inter.className} h-full`}>
        <body className="min-h-full bg-slate-50 text-slate-900">
          <TRPCProvider>
            <Navbar />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
              <p>© {new Date().getFullYear()} 居民议题协商投票站 · 共建美好家园</p>
            </footer>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
