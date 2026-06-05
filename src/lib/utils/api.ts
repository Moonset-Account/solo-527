import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/lib/types';

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta,
  });
}

export function errorResponse(message: string, errors?: string[], status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('user');
  
  if (userCookie) {
    try {
      return JSON.parse(userCookie.value);
    } catch {
      return null;
    }
  }
  
  return null;
}
