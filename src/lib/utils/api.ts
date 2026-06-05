import { NextResponse } from 'next/server';
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

export function getServerSession() {
  const cookies = require('next/headers').cookies();
  const userCookie = cookies.get('user');
  
  if (userCookie) {
    try {
      return JSON.parse(userCookie.value);
    } catch {
      return null;
    }
  }
  
  return null;
}
