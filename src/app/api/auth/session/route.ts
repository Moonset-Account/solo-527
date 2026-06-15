import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AuthUser, UserRole } from '@/types'

export async function GET() {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    const mockUser: AuthUser = {
      id: 'mock-id',
      email: 'demo@lab.test',
      role: 'researcher',
      display_name: '演示用户',
      lab_id: '',
    }
    return NextResponse.json(mockUser)
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    try {
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('role, display_name, lab_id')
        .eq('id', user.id)
        .single()

      if (error || !userRecord) {
        const fallbackUser: AuthUser = {
          id: user.id,
          email: user.email,
          role: 'researcher',
          display_name: user.user_metadata?.display_name ?? user.email,
          lab_id: user.user_metadata?.lab_id ?? '',
        }
        return NextResponse.json(fallbackUser)
      }

      const role = (['researcher', 'archivist', 'admin', 'equipment_teacher'].includes(
        userRecord.role as UserRole
      )
        ? userRecord.role
        : 'researcher') as UserRole

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        role,
        display_name: userRecord.display_name,
        lab_id: userRecord.lab_id ?? '',
      }

      return NextResponse.json(authUser)
    } catch {
      const fallbackUser: AuthUser = {
        id: user.id,
        email: user.email,
        role: 'researcher',
        display_name: user.user_metadata?.display_name ?? user.email,
        lab_id: user.user_metadata?.lab_id ?? '',
      }
      return NextResponse.json(fallbackUser)
    }
  } catch {
    return NextResponse.json({ error: '会话验证失败' }, { status: 500 })
  }
}
