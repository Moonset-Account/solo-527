import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AuthUser, UserRole } from '@/types'
import AppShell from '@/components/layout/AppShell'
import { DashboardBody } from '@/components/dashboard/DashboardClient'

export default async function HomePage() {
  const supabase = createSupabaseServerClient()

  let initialUser: AuthUser | null = null

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !user.email) {
        redirect('/login')
      }

      try {
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('role, display_name, lab_id')
          .eq('id', user.id)
          .single()

        if (error || !userRecord) {
          initialUser = {
            id: user.id,
            email: user.email,
            role: 'researcher',
            display_name: user.user_metadata?.display_name ?? user.email,
            lab_id: user.user_metadata?.lab_id ?? '',
          }
        } else {
          const role = (['researcher', 'archivist', 'admin', 'equipment_teacher'].includes(
            userRecord.role as UserRole
          )
            ? userRecord.role
            : 'researcher') as UserRole

          initialUser = {
            id: user.id,
            email: user.email,
            role,
            display_name: userRecord.display_name,
            lab_id: userRecord.lab_id ?? '',
          }
        }
      } catch {
        initialUser = {
          id: user.id,
          email: user.email,
          role: 'researcher',
          display_name: user.user_metadata?.display_name ?? user.email,
          lab_id: user.user_metadata?.lab_id ?? '',
        }
      }
    } catch {
      initialUser = {
        id: 'mock-id',
        email: 'demo@lab.test',
        role: 'researcher',
        display_name: '演示用户',
        lab_id: '',
      }
    }
  } else {
    initialUser = {
      id: 'mock-id',
      email: 'demo@lab.test',
      role: 'researcher',
      display_name: '演示用户',
      lab_id: '',
    }
  }

  return (
    <AppShell initialUser={initialUser}>
      <DashboardBody initialUser={initialUser} />
    </AppShell>
  )
}
