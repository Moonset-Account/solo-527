import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const keyword = request.input('keyword', '')
    const department = request.input('department', '')
    const role = request.input('role', '')

    const query = User.query()
      .preload('roles')
      .if(keyword, (q) => {
        q.where((subQ) => {
          subQ.where('username', 'like', `%${keyword}%`)
            .orWhere('real_name', 'like', `%${keyword}%`)
            .orWhere('email', 'like', `%${keyword}%`)
        })
      })
      .if(department, (q) => {
        q.where('department', department)
      })
      .if(role, (q) => {
        q.whereHas('roles', (roleQuery) => {
          roleQuery.where('slug', role)
        })
      })
      .orderBy('id', 'desc')

    const users = await query.paginate(page, perPage)

    return response.ok({
      data: users.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const user = await User.findOrFail(params.id)
      await user.load('roles')

      return response.ok({
        data: user.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '用户不存在' })
    }
  }

  public async store({ request, response }: HttpContextContract) {
    const userSchema = schema.create({
      username: schema.string({}, [
        rules.unique({ table: 'users', column: 'username' }),
        rules.minLength(3),
      ]),
      email: schema.string({}, [
        rules.email(),
        rules.unique({ table: 'users', column: 'email' }),
      ]),
      password: schema.string({}, [
        rules.minLength(6),
      ]),
      realName: schema.string({}, [
        rules.minLength(2),
      ]),
      phone: schema.string.optional({}, [
        rules.mobile({ locale: ['zh-CN'] }),
      ]),
      department: schema.string.optional(),
      roleIds: schema.array().members(schema.number([
        rules.exists({ table: 'roles', column: 'id' }),
      ])),
    })

    const data = await request.validate({ schema: userSchema })

    const user = new User()
    user.username = data.username
    user.email = data.email
    user.password = data.password
    user.realName = data.realName
    user.phone = data.phone || null
    user.department = data.department || null

    await user.save()

    if (data.roleIds && data.roleIds.length > 0) {
      await user.related('roles').attach(data.roleIds)
    }

    await user.load('roles')

    return response.created({
      message: '用户创建成功',
      data: user.serialize(),
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const user = await User.findOrFail(params.id)

      const userSchema = schema.create({
        username: schema.string({}, [
          rules.unique({ table: 'users', column: 'username', whereNot: { id: params.id } }),
          rules.minLength(3),
        ]),
        email: schema.string({}, [
          rules.email(),
          rules.unique({ table: 'users', column: 'email', whereNot: { id: params.id } }),
        ]),
        realName: schema.string({}, [
          rules.minLength(2),
        ]),
        phone: schema.string.optional({}, [
          rules.mobile({ locale: ['zh-CN'] }),
        ]),
        department: schema.string.optional(),
        isActive: schema.boolean.optional(),
        roleIds: schema.array.optional().members(schema.number([
          rules.exists({ table: 'roles', column: 'id' }),
        ])),
      })

      const data = await request.validate({ schema: userSchema })

      user.username = data.username
      user.email = data.email
      user.realName = data.realName
      user.phone = data.phone || null
      user.department = data.department || null
      if (data.isActive !== undefined) {
        user.isActive = data.isActive
      }

      await user.save()

      if (data.roleIds !== undefined) {
        await user.related('roles').sync(data.roleIds)
      }

      await user.load('roles')

      return response.ok({
        message: '用户更新成功',
        data: user.serialize(),
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '用户不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const user = await User.findOrFail(params.id)
      await user.delete()

      return response.ok({
        message: '用户删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '用户不存在' })
    }
  }

  public async list({ response }: HttpContextContract) {
    const users = await User.query()
      .where('is_active', true)
      .preload('roles')
      .orderBy('real_name', 'asc')

    return response.ok({
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        realName: u.realName,
        department: u.department,
        roles: u.roles.map((r) => r.slug),
      })),
    })
  }
}
