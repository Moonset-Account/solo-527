import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const role = request.input('role')
    const keyword = request.input('keyword')

    const query = User.query()
    if (role) query.where('role', role)
    if (keyword) {
      query.where((q) => {
        q.where('username', 'like', `%${keyword}%`).orWhere('email', 'like', `%${keyword}%`)
      })
    }

    const users = await query.orderBy('id', 'desc').paginate(page, perPage)
    return response.json(users)
  }

  public async store({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      username: schema.string({ trim: true }, [rules.maxLength(50)]),
      email: schema.string({ trim: true }, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
      password: schema.string({}, [rules.minLength(6)]),
      role: schema.enum(['admin', 'operator', 'finance', 'video_team']),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = await User.create(data)

    return response.status(201).json(user)
  }

  public async show({ params, response }: HttpContextContract) {
    const user = await User.findOrFail(params.id)
    return response.json(user)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const user = await User.findOrFail(params.id)

    const validationSchema = schema.create({
      username: schema.string.optional({ trim: true }),
      role: schema.enum.optional(['admin', 'operator', 'finance', 'video_team']),
      isActive: schema.boolean.optional(),
      password: schema.string.optional({}, [rules.minLength(6)]),
    })

    const data = await request.validate({ schema: validationSchema })
    user.merge(data)
    await user.save()

    return response.json(user)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const user = await User.findOrFail(params.id)
    user.isActive = false
    await user.save()
    return response.json({ message: '用户已禁用' })
  }
}
