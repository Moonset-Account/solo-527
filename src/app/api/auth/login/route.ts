import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { recordHistory } from '@/lib/history'
import { getRequestContext } from '@/lib/middleware'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = loginSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: '参数验证失败', details: validated.error.errors },
        { status: 400 }
      )
    }

    const result = await authenticateUser(validated.data.email, validated.data.password)

    if (!result) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    const ctx = getRequestContext(req)
    await recordHistory('User', result.user.id, 'LOGIN', {
      userId: result.user.id,
      ...ctx,
    })

    return NextResponse.json({
      success: true,
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          phone: result.user.phone,
          avatar: result.user.avatar,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '登录失败' },
      { status: 500 }
    )
  }
}
