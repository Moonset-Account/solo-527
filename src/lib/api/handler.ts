import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, forbiddenResponse, errorResponse } from './response'
import { isStaffRole, isAdminRole } from '@/lib/auth/middleware'
import type { UserRole } from '@/types/database'
import { z } from 'zod'

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  if (!userId) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role || null
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
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const role = await getCurrentUserRole()
  if (!isStaffRole(role)) {
    throw new Error('FORBIDDEN')
  }
  return userId
}

export async function requireAdmin() {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const role = await getCurrentUserRole()
  if (!isAdminRole(role)) {
    throw new Error('FORBIDDEN')
  }
  return userId
}

export function handleApiError(error: unknown) {
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
