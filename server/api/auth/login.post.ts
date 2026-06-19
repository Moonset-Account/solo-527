import { prisma } from '~/server/utils/prisma'
import { verifyPassword, generateToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, password } = body

  if (!phone || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '手机号和密码不能为空',
    })
  }

  const user = await prisma.user.findUnique({
    where: { phone },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '手机号或密码错误',
    })
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw createError({
      statusCode: 401,
      statusMessage: '手机号或密码错误',
    })
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
    name: user.name,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token,
  }
})
