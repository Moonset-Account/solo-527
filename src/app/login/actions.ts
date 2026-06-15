'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

interface SignInParams {
  email: string
  password: string
}

interface SignUpParams {
  email: string
  password: string
  display_name: string
  role?: UserRole
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function signInWithPassword(
  { email, password }: SignInParams,
  redirectTo?: string | null
): Promise<ActionResult> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return {
      success: false,
      error: 'Supabase 未配置，请联系管理员设置环境变量。目前可用测试账号登录查看界面。',
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message || '登录失败，请检查邮箱和密码',
      }
    }

    if (data.user) {
      try {
        const { error: upsertError } = await supabase.from('users').upsert(
          {
            id: data.user.id,
            email: data.user.email ?? email,
            display_name: data.user.user_metadata?.display_name ?? data.user.email ?? email,
            role: (data.user.user_metadata?.role as UserRole) ?? 'researcher',
            lab_id: data.user.user_metadata?.lab_id ?? 'lab-1',
          },
          { onConflict: 'id' }
        )

        if (upsertError) {
          console.error('Upsert user failed:', upsertError)
        }
      } catch (e) {
        console.error('Upsert user exception:', e)
      }
    }

    const target = redirectTo && redirectTo !== '/login' ? redirectTo : '/'
    redirect(target)
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : '登录时发生未知错误',
    }
  }
}

export async function signUp(
  { email, password, display_name, role = 'researcher' }: SignUpParams,
  redirectTo?: string | null
): Promise<ActionResult> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return {
      success: false,
      error: 'Supabase 未配置，暂不支持注册。请使用测试账号登录。',
    }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
          role,
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message || '注册失败，请稍后重试',
      }
    }

    if (data.user) {
      try {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email ?? email,
          display_name,
          role,
          lab_id: 'lab-1',
        })

        if (insertError) {
          console.error('Insert user failed:', insertError)
        }
      } catch (e) {
        console.error('Insert user exception:', e)
      }
    }

    const target = redirectTo && redirectTo !== '/login' ? redirectTo : '/'
    redirect(target)
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : '注册时发生未知错误',
    }
  }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    redirect('/login')
  }

  try {
    await supabase!.auth.signOut()
  } catch (e) {
    console.error('SignOut exception:', e)
  }
  redirect('/login')
}
