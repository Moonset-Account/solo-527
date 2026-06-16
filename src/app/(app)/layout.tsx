import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { ReactNode } from 'react'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
