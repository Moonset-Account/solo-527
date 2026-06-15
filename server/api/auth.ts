import bcrypt from 'bcryptjs'
import { generateToken, setAuthCookie, clearAuthCookie, getAuthUser } from '~/server/utils/auth'
import { mockUsers, mockRoles } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST') {
    const body = await readBody(event)
    const { username, password } = body

    const user = mockUsers.find(u => u.username === username)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户名或密码错误'
      })
    }

    const isValid = password === '123456'
    
    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户名或密码错误'
      })
    }

    const role = mockRoles.find(r => r.id === user.roleId)
    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      role: role?.name
    })

    setAuthCookie(event, token)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: role?.name,
        avatarUrl: user.avatarUrl
      }
    }
  }

  if (method === 'DELETE') {
    clearAuthCookie(event)
    return { message: '退出登录成功' }
  }

  if (method === 'GET') {
    const user = getAuthUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登录'
      })
    }
    const role = mockRoles.find(r => r.id === user.roleId)
    return {
      ...user,
      roleName: role?.name
    }
  }
})
