import type { HttpContext } from '@adonisjs/core/http'
import Community from '#models/community'
import { createCommunityValidator, updateCommunityValidator } from '#validators/community'

export default class CommunitiesController {
  async index({ request, response }: HttpContext) {
    const { page = 1, perPage = 10, keyword, district } = request.qs() as {
      page?: number
      perPage?: number
      keyword?: string
      district?: string
    }

    const query = Community.query().orderBy('id', 'desc')

    if (keyword) {
      query.where('name', 'like', `%${keyword}%`)
    }

    if (district) {
      query.where('district', district)
    }

    const communities = await query.paginate(page, perPage)

    return response.json({
      data: communities.toJSON(),
    })
  }

  async all({ response }: HttpContext) {
    const communities = await Community.query()
      .orderBy('name', 'asc')

    return response.json({
      data: communities,
    })
  }

  async show({ params, response }: HttpContext) {
    const community = await Community.find(params.id)
    if (!community) {
      return response.status(404).json({ message: '社区不存在' })
    }

    return response.json({ data: community })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createCommunityValidator)

    const existing = await Community.query()
      .where('name', data.name)
      .first()

    if (existing) {
      return response
        .status(400)
        .json({ message: '该社区名称已存在' })
    }

    const community = await Community.create(data)

    return response.status(201).json({
      message: '社区创建成功',
      data: community,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const community = await Community.find(params.id)
    if (!community) {
      return response.status(404).json({ message: '社区不存在' })
    }

    const data = await request.validateUsing(updateCommunityValidator)

    if (data.name && data.name !== community.name) {
      const existing = await Community.query()
        .where('name', data.name)
        .whereNot('id', params.id)
        .first()

      if (existing) {
        return response
          .status(400)
          .json({ message: '该社区名称已存在' })
      }
    }

    community.merge(data)
    await community.save()

    return response.json({
      message: '社区更新成功',
      data: community,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const community = await Community.find(params.id)
    if (!community) {
      return response.status(404).json({ message: '社区不存在' })
    }

    await community.delete()

    return response.json({ message: '社区已删除' })
  }
}
