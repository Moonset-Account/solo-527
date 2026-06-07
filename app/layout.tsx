import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '物流中转迟滞地图',
  description: '区域调度复盘系统 - 中转站停留时长、晚点路径和异常原因分析',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
