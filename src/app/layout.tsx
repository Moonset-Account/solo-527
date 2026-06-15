import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '实验预约数据登记站',
  description: '科研实验室综合管理平台 - 预约、归档、审批、看板一站式管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  )
}
