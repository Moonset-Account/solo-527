"use client"

import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-[220px] flex min-h-screen flex-col transition-all duration-300">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
