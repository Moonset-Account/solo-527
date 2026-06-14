import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BrandPartnership from 'App/Models/BrandPartnership'
import PartnershipStage from 'App/Models/PartnershipStage'
import RevisionService from 'App/Services/RevisionService'
import { schema } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'

export default class BrandPartnershipsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const stage = request.input('stage')
    const status = request.input('status')
    const priority = request.input('priority')
    const keyword = request.input('keyword')
    const responsibleUserId = request.input('responsibleUserId')

    const query = BrandPartnership.query().preload('responsibleUser')
    if (stage) query.where('currentStage', stage)
    if (status) query.where('status', status)
    if (priority) query.where('priority', priority)
    if (responsibleUserId) query.where('responsibleUserId', responsibleUserId)
    if (keyword) {
      query.where((q) => {
        q.where('brandName', 'like', `%${keyword}%`).orWhere('code', 'like', `%${keyword}%`)
      })
    }

    const partnerships = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.json(partnerships)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      brandName: schema.string(),
      brandIndustry: schema.string.optional(),
      contactName: schema.string.optional(),
      contactPhone: schema.string.optional(),
      contactEmail: schema.string.optional(),
      contractAmount: schema.number.optional(),
      currentStage: schema.string.optional(),
      priority: schema.string.optional(),
      status: schema.string.optional(),
      responsibleUserId: schema.number.optional(),
      expectedSignDate: schema.date.optional(),
      description: schema.string.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    data.code = `BP${Date.now()}`
    data.currentStage = data.currentStage || 'lead'
    data.status = data.status || 'active'
    data.priority = data.priority || 'normal'

    const partnership = await BrandPartnership.create(data)

    await PartnershipStage.create({
      partnershipId: partnership.id,
      stage: data.currentStage,
      status: 'active',
      notes: '系统自动创建初始阶段',
      createdBy: auth.user?.id,
    })

    return response.status(201).json(partnership)
  }

  public async show({ params, response }: HttpContextContract) {
    const partnership = await BrandPartnership.query()
      .where('id', params.id)
      .preload('responsibleUser')
      .preload('stages', (q) => q.orderBy('createdAt', 'asc').preload('creator'))
      .preload('benefits')
      .preload('orders')
      .firstOrFail()

    return response.json(partnership)
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    const partnership = await BrandPartnership.findOrFail(params.id)
    const beforeData = partnership.toJSON()

    const validationSchema = schema.create({
      brandName: schema.string.optional(),
      brandIndustry: schema.string.optional(),
      contactName: schema.string.optional(),
      contactPhone: schema.string.optional(),
      contactEmail: schema.string.optional(),
      contractAmount: schema.number.optional(),
      currentStage: schema.string.optional(),
      priority: schema.string.optional(),
      status: schema.string.optional(),
      responsibleUserId: schema.number.optional(),
      expectedSignDate: schema.date.optional(),
      actualSignDate: schema.date.optional(),
      description: schema.string.optional(),
    })

    const data = await request.validate({ schema: validationSchema })

    if (data.currentStage && data.currentStage !== partnership.currentStage) {
      const activeStage = await PartnershipStage.query()
        .where('partnershipId', partnership.id)
        .where('stage', partnership.currentStage)
        .where('status', 'active')
        .first()

      if (activeStage) {
        activeStage.status = 'completed'
        activeStage.completedAt = DateTime.now()
        await activeStage.save()
      }

      await PartnershipStage.create({
        partnershipId: partnership.id,
        stage: data.currentStage,
        status: 'active',
        createdBy: auth.user?.id,
      })
    }

    partnership.merge(data)
    await partnership.save()

    await RevisionService.log(
      'brand_partnership',
      partnership.id,
      beforeData,
      partnership.toJSON(),
      auth.user?.id,
      '更新合作信息'
    )

    return response.json(partnership)
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    const partnership = await BrandPartnership.findOrFail(params.id)
    partnership.status = 'cancelled'
    await partnership.save()

    await RevisionService.log(
      'brand_partnership',
      partnership.id,
      partnership.toJSON(),
      { ...partnership.toJSON(), status: 'cancelled' },
      auth.user?.id,
      '终止合作'
    )

    return response.json({ message: '合作已终止' })
  }

  public async getStages({ params, response }: HttpContextContract) {
    const stages = await PartnershipStage.query()
      .where('partnershipId', params.id)
      .preload('creator')
      .orderBy('createdAt', 'asc')
    return response.json(stages)
  }

  public async addStage({ params, request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      stage: schema.string(),
      notes: schema.string.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const stage = await PartnershipStage.create({
      partnershipId: params.id,
      stage: data.stage,
      status: 'pending',
      notes: data.notes,
      createdBy: auth.user?.id,
    })

    return response.status(201).json(stage)
  }

  public async updateStage({ params, request, response }: HttpContextContract) {
    const stage = await PartnershipStage.findOrFail(params.stageId)
    const data = request.only(['status', 'notes', 'completedAt'])
    stage.merge(data)
    await stage.save()
    return response.json(stage)
  }
}
