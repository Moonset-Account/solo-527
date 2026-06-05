// @ts-nocheck
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user.id
    
    if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return 'mock-user-id-001'
    }
    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return 'mock-user-id-001'
    }
    return null
  }
}

export async function getCurrentUserRole() {
  try {
    const supabase = createClient()
    const userId = await getCurrentUserId()
    if (!userId) return 'client' as const
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    return profile?.role || 'client'
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return 'admin' as const
    }
    return 'client' as const
  }
}

export async function requireAuth() {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return userId
}

export async function requireStaff() {
  const userId = await getCurrentUserId()
  const role = await getCurrentUserRole()
  if (!userId || role === 'client') {
    throw new Error('FORBIDDEN')
  }
  return userId
}

export async function requireAdmin() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    throw new Error('FORBIDDEN')
  }
  return await getCurrentUserId()
}

export function handleApiError(error: unknown) {
  const { errorResponse, unauthorizedResponse, forbiddenResponse } = require('./response')
  
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse()
    }
    if (error.message === 'FORBIDDEN') {
      return forbiddenResponse()
    }
    return errorResponse(error.message)
  }
  return errorResponse('Internal server error', 500)
}

export async function insertAuditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldData?: any,
  newData?: any
) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
    })
    
    if (error) console.error('Failed to insert audit log:', error)
  } catch (error) {
    console.error('Failed to insert audit log:', error)
  }
}

export async function validateRequest<T extends z.ZodType<any, any>>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json()
  const result = schema.safeParse(body)
  
  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    const error = new Error('VALIDATION_ERROR')
    ;(error as any).validationErrors = errors
    throw error
  }
  
  return result.data
}

export async function getSearchParams(request: NextRequest) {
  const url = new URL(request.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}
