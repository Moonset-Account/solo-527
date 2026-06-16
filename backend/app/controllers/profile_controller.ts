import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await (user as any).load('roles')
    
    return {
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        name: user.fullName,
        phone: user.phone,
        department: user.department,
        status: user.status,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        })),
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }
    }
  }

  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const data = request.only(['fullName', 'phone', 'department'])
    
    user.merge(data)
    await user.save()
    
    return response.ok({
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        department: user.department,
      },
      message: '更新成功',
    })
  }
}
