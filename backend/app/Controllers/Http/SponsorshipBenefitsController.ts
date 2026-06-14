import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SponsorshipBenefit from 'App/Models/SponsorshipBenefit'
import RevisionService from 'App/Services/RevisionService'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class SponsorshipBenefitsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const partnershipId = request.input('partnershipId')
    const benefitType = request.input('benefitType')
    const status = request.input('status')
    const deliveryStatus = request.input('deliveryStatus')
    const revisionRound = request.input('revisionRound')

    const query = SponsorshipBenefit.query().preload('partnership')
    if (partnershipId) query.where('partnershipId', partnershipId)
    if (benefitType) query.where('benefitType', benefitType)
    if (status) query.where('status', status)
    if (deliveryStatus) query.where('deliveryStatus', deliveryStatus)
    if (revisionRound) query.where('revisionRound', revisionRound)

    const benefits = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.json(benefits)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      partnershipId: schema.number(),
      benefitType: schema.string(),
      name: schema.string(),
      description: schema.string.optional(),
      quantity: schema.number.optional(),
      unitPrice: schema.number.optional(),
      totalAmount: schema.number.optional(),
      status: schema.string.optional(),
      deliveryStatus: schema.string.optional(),
      expectedDeliveryDate: schema.date.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    data.status = data.status || 'draft'
    data.deliveryStatus = data.deliveryStatus || 'pending'
    data.revisionRound = 1

    const benefit = await SponsorshipBenefit.create(data)

    await RevisionService.log(
      'sponsorship_benefit',
      benefit.id,
      null,
      benefit.toJSON(),
      auth.user?.id,
      '创建赞助权益'
    )

    return response.status(201).json(benefit)
  }

  public async show({ params, response }: HttpContextContract) {
    const benefit = await SponsorshipBenefit.query()
      .where('id', params.id)
      .preload('partnership')
      .preload('comments', (q) => q.preload('user').orderBy('createdAt', 'desc'))
      .preload('attachments', (q) => q.preload('uploader').orderBy('createdAt', 'desc'))
      .firstOrFail()

    return response.json(benefit)
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    const benefit = await SponsorshipBenefit.findOrFail(params.id)
    const beforeData = benefit.toJSON()

    const validationSchema = schema.create({
      benefitType: schema.string.optional(),
      name: schema.string.optional(),
      description: schema.string.optional(),
      quantity: schema.number.optional(),
      unitPrice: schema.number.optional(),
      totalAmount: schema.number.optional(),
      status: schema.string.optional(),
      deliveryStatus: schema.string.optional(),
      expectedDeliveryDate: schema.date.optional(),
      actualDeliveryDate: schema.date.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const hasChanges = Object.keys(data).some(
      (k) => benefit[k as keyof SponsorshipBenefit] !== data[k as keyof typeof data]
    )

    if (hasChanges) {
      benefit.revisionRound += 1
    }

    benefit.merge(data)
    await benefit.save()

    await RevisionService.log(
      'sponsorship_benefit',
      benefit.id,
      beforeData,
      benefit.toJSON(),
      auth.user?.id,
      `修改赞助权益（第 ${benefit.revisionRound} 轮）`
    )

    return response.json(benefit)
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    const benefit = await SponsorshipBenefit.findOrFail(params.id)
    await RevisionService.log(
      'sponsorship_benefit',
      benefit.id,
      benefit.toJSON(),
      null,
      auth.user?.id,
      '删除赞助权益'
    )
    await benefit.delete()
    return response.json({ message: '已删除' })
  }
}
