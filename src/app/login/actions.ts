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
  _redirectTarget?: string
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

  let result: ActionResult = { success: false }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      result = {
        success: false,
        error: error.message || '登录失败，请检查邮箱和密码',
      }
    } else if (data.user) {
      const { error: upsertError } = await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          display_name: data.user.user_metadata?.display_name ?? data.user.email ?? email,
          role: (data.user.user_metadata?.role as UserRole) ?? 'researcher',
          lab_id: data.user.user_metadata?.lab_id ?? null,
        },
        { onConflict: 'id' }
      )

      if (upsertError) {
        result = {
          success: false,
          error: '用户档案写入失败，请稍后重试',
        }
      } else {
        const target = redirectTo && redirectTo !== '/login' ? redirectTo : '/'
        result = { success: true, _redirectTarget: target }
      }
    } else {
      result = {
        success: false,
        error: '登录失败，用户数据为空',
      }
    }
  } catch (e) {
    result = {
      success: false,
      error: e instanceof Error ? e.message : '登录时发生未知错误',
    }
  }

  if (result.success && result._redirectTarget) {
    redirect(result._redirectTarget)
  }

  return result
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

  let result: ActionResult = { success: false }

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
      result = {
        success: false,
        error: error.message || '注册失败，请稍后重试',
      }
    } else if (data.user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email ?? email,
        display_name,
        role,
        lab_id: null,
      })

      if (insertError) {
        result = {
          success: false,
          error: '用户档案创建失败，请稍后重试',
        }
      } else {
        const target = redirectTo && redirectTo !== '/login' ? redirectTo : '/'
        result = { success: true, _redirectTarget: target }
      }
    } else {
      result = {
        success: false,
        error: '注册失败，用户数据为空',
      }
    }
  } catch (e) {
    result = {
      success: false,
      error: e instanceof Error ? e.message : '注册时发生未知错误',
    }
  }

  if (result.success && result._redirectTarget) {
    redirect(result._redirectTarget)
  }

  return result
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
