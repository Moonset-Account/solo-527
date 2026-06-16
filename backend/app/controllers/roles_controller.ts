import Role from '#models/role'
import Permission from '#models/permission'
import OperationLog from '#models/operation_log'
import {
  indexRoleValidator,
  storeRoleValidator,
  updateRoleValidator,
  assignPermissionsValidator,
} from '#validators/role_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class RolesController {
  async index({ request, auth }: HttpContext) {
    const { page = 1, perPage = 20, keyword } = await request.validateUsing(indexRoleValidator)

    const query = Role.query()

    if (keyword) {
      query.where((q) => {
        q.where('name', 'like', `%${keyword}%`).orWhere('displayName', 'like', `%${keyword}%`)
      })
    }

    query.orderBy('createdAt', 'desc')

    const roles = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_roles',
      resourceType: 'role',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, keyword },
    })

    return {
      data: roles.toJSON().data,
      meta: {
        total: roles.total,
        page: roles.currentPage,
        perPage: roles.perPage,
        lastPage: roles.lastPage,
      },
    }
  }

  async show({ request, auth }: HttpContext) {
    const id = request.param('id')

    const role = await Role.query().where('id', id).preload('permissions').firstOrFail()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_role',
      resourceType: 'role',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { roleId: id },
    })

    return role
  }

  async store({ request, auth }: HttpContext) {
    const data = await request.validateUsing(storeRoleValidator)

    const role = await db.transaction(async () => {
      const role = await Role.create({
        name: data.name,
        displayName: data.displayName,
        description: data.description || null,
      })

      if (data.permissionIds && data.permissionIds.length > 0) {
        const permissions = await Permission.query().whereIn('id', data.permissionIds)
        await role.related('permissions').saveMany(permissions)
      }

      return role
    })

    await role.load('permissions')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'create_role',
      resourceType: 'role',
      resourceId: role.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissionIds: data.permissionIds,
      },
    })

    return role
  }

  async update({ request, auth }: HttpContext) {
    const id = request.param('id')
    const data = await request.validateUsing(updateRoleValidator)

    const role = await Role.findOrFail(id)

    role.merge({
      name: data.name,
      displayName: data.displayName,
      description: data.description ?? undefined,
    })

    await role.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'update_role',
      resourceType: 'role',
      resourceId: role.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      },
    })

    return role
  }

  async destroy({ request, auth }: HttpContext) {
    const id = request.param('id')

    const role = await Role.findOrFail(id)
    await role.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'delete_role',
      resourceType: 'role',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { roleId: id, name: role.name },
    })

    return {
      message: '角色删除成功',
    }
  }

  async assignPermissions({ request, auth }: HttpContext) {
    const id = request.param('id')
    const { permissionIds } = await request.validateUsing(assignPermissionsValidator)

    const role = await Role.findOrFail(id)
    await role.related('permissions').sync(permissionIds)
    await role.load('permissions')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'assign_role_permissions',
      resourceType: 'role',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { permissionIds },
    })

    return role
  }
}
