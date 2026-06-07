import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function GET() {
  try {
    const users = await dataAccess.getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}
