import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'CUSTOMER_SERVICE') {
    redirect('/dashboard')
  }
  return <div>{children}</div>
}
