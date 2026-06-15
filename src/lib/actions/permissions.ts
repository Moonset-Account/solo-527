'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type {
  PermissionRequest,
  PermissionRequestStatus,
  UserRole,
  AuditLog,
  FilterParams,
} from '@/types'

export async function submitPermissionRequest(params: {
  requested_role: UserRole
  reason?: string
}): Promise<{
  request?: PermissionRequest
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { data: newRequest, error: insertError } = await supabase
      .from('permission_requests')
      .insert({
        user_id: userId,
        requested_role: params.requested_role,
        status: 'pending',
        reason: params.reason || null,
      })
      .select(`
        *,
        user:users(*)
      `)
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'submit_permission_request',
      resource_type: 'permission_request',
      resource_id: (newRequest as PermissionRequest).id,
      details: { requested_role: params.requested_role },
    })

    return { request: newRequest as PermissionRequest }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '提交申请失败' }
  }
}

export async function reviewPermissionRequest(params: {
  id: string
  status: 'approved' | 'rejected'
}): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: reviewerData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (reviewerData?.role !== 'admin') {
      return { error: '无权限审批' }
    }

    const reviewerId = reviewerData.id

    const { data: request } = await supabase
      .from('permission_requests')
      .select('id, user_id, requested_role, status')
      .eq('id', params.id)
      .single()

    if (!request) {
      return { error: '申请不存在' }
    }

    if (request.status !== 'pending') {
      return { error: '该申请已处理' }
    }

    const { error: updateError } = await supabase
      .from('permission_requests')
      .update({
        status: params.status as PermissionRequestStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      return { error: updateError.message }
    }

    if (params.status === 'approved') {
      await supabase
        .from('users')
        .update({ role: request.requested_role })
        .eq('id', request.user_id)
    }

    await supabase.from('audit_logs').insert({
      user_id: reviewerId,
      action: 'review_permission_request',
      resource_type: 'permission_request',
      resource_id: params.id,
      details: {
        status: params.status,
        target_user_id: request.user_id,
        requested_role: request.requested_role,
      },
    })

    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '审批失败' }
  }
}

export async function listPermissionRequests(
  status?: string
): Promise<{
  requests?: PermissionRequest[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { requests: [] }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { requests: [] }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id
    const userRole = userData?.role || 'researcher'

    let query = supabase
      .from('permission_requests')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false })

    if (userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      return { requests: [] }
    }

    return { requests: (requests || []) as PermissionRequest[] }
  } catch {
    return { requests: [] }
  }
}

export async function listAuditLogs(
  filters?: FilterParams & { page?: number; page_size?: number }
): Promise<{
  logs?: AuditLog[]
  total?: number
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { logs: [] }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return { error: '无权限查看审计日志' }
    }

    const page = filters?.page || 1
    const pageSize = filters?.page_size || 50
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to + 'T23:59:59Z')
    }

    query = query.range(offset, offset + pageSize - 1)

    const { data: logs, error, count } = await query

    if (error) {
      return { logs: [] }
    }

    return {
      logs: (logs || []) as AuditLog[],
      total: count || 0,
    }
  } catch {
    return { logs: [] }
  }
}
