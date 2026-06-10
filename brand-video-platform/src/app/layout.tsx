import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: '品牌短视频选题策划台',
  description: '一站式选题脚本拍摄剪辑分派与产能追踪',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Sidebar />
        <main className="ml-60 min-h-screen bg-surface">
          {children}
        </main>
      </body>
    </html>
  )
}
