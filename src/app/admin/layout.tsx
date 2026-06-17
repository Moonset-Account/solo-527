"use client"

import { useEffect } from "react"
import AdminLayout from "@/components/layout/admin-layout"
import { useAppStore } from "@/store/app-store"

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const initializeFromMock = useAppStore((s) => s.initializeFromMock)

  useEffect(() => {
    initializeFromMock()
  }, [initializeFromMock])

  return <AdminLayout>{children}</AdminLayout>
}
