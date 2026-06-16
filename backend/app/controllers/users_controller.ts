import User from '#models/user'
import Role from '#models/role'
import OperationLog from '#models/operation_log'
import {
  indexUserValidator,
  storeUserValidator,
  updateUserValidator,
  assignRolesValidator,
} from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class UsersController {
  async index({ request, auth, serialize }: HttpContext) {
    const { page = 1, perPage = 20, keyword, status } = await request.validateUsing(indexUserValidator)

    const query = User.query()

    if (keyword) {
      query.where((q) => {
        q.where('fullName', 'like', `%${keyword}%`)
          .orWhere('email', 'like', `%${keyword}%`)
          .orWhere('phone', 'like', `%${keyword}%`)
      })
    }

    if (status) {
      query.where('status', status)
    }

    query.preload('roles')
    query.orderBy('createdAt', 'desc')

    const users = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_users',
      resourceType: 'user',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, keyword, status },
    })

    return serialize(users)
  }

  async show({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')

    const user = await User.query().where('id', id).preload('roles').firstOrFail()

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'view_user',
      resourceType: 'user',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { userId: id },
    })

    return serialize(user)
  }

  async store({ request, auth, serialize }: HttpContext) {
    const data = await request.validateUsing(storeUserValidator)

    const user = await db.transaction(async () => {
      const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        department: data.department || null,
        status: data.status || 'active',
      })

      if (data.roleIds && data.roleIds.length > 0) {
        const roles = await Role.query().whereIn('id', data.roleIds)
        await user.related('roles').saveMany(roles)
      }

      return user
    })

    await user.load('roles')

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'create_user',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        department: data.department,
        status: data.status,
        roleIds: data.roleIds,
      },
    })

    return serialize(user)
  }

  async update({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const data = await request.validateUsing(updateUserValidator)

    const user = await User.findOrFail(id)

    user.merge({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? undefined,
      department: data.department ?? undefined,
      status: data.status,
    })

    if (data.password) {
      user.password = data.password
    }

    await user.save()

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'update_user',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        department: data.department,
        status: data.status,
      },
    })

    return serialize(user)
  }

  async destroy({ request, auth }: HttpContext) {
    const id = request.param('id')

    const user = await User.findOrFail(id)
    await user.delete()

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'delete_user',
      resourceType: 'user',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { userId: id, email: user.email },
    })

    return {
      message: '用户删除成功',
    }
  }

  async assignRoles({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const { roleIds } = await request.validateUsing(assignRolesValidator)

    const user = await User.findOrFail(id)
    await user.related('roles').sync(roleIds)
    await user.load('roles')

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'assign_user_roles',
      resourceType: 'user',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { roleIds },
    })

    return serialize(user)
  }

  async getRoles({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')

    const user = await User.findOrFail(id)
    const roles = await user.related('roles').query()

    const currentUser = auth.getUserOrFail()
    await OperationLog.create({
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email,
      action: 'view_user_roles',
      resourceType: 'user',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { userId: id },
    })

    return serialize(roles)
  }
}
