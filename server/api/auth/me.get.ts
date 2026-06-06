import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }
  
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    community: user.community,
    gridArea: user.gridArea,
    propertyCompany: user.propertyCompany
  }
})
