import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "医院门诊等待时间分析平台",
  description: "医院门诊等待时间多维度分析与可视化平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-50">{children}</body>
    </html>
  );
}
