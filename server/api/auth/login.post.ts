import User from '~/server/models/User'
import { generateToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空'
    })
  }

  const user = await User.findOne({ username })
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    })
  }

  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    })
  }

  const token = generateToken(user._id.toString(), user.role)
  
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  return {
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      community: user.community,
      gridArea: user.gridArea,
      propertyCompany: user.propertyCompany
    },
    token
  }
})
