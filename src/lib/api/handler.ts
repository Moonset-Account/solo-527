import { NextRequest } from 'next/server'
import { z } from 'zod'

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const mockUserId = 'mock-user-id-001'
    return mockUserId
  } catch (error) {
    return null
  }
}

export async function getCurrentUserRole() {
  return 'admin' as const
}

export async function requireAuth() {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return userId
}

export async function requireStaff() {
  return 'mock-user-id-001'
}

export async function requireAdmin() {
  return 'mock-user-id-001'
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
