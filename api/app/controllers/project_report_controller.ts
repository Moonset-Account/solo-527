import Project from '#models/project'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProjectReportController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')

    const query = Project.query().preload('principal')

    if (status) {
      query.where('status', status)
    }

    const projects = await query.orderBy('created_at', 'desc').paginate(page, limit)
    return response.ok(projects)
  }

  async show({ params, response }: HttpContext) {
    const project = await Project.query()
      .where('id', params.id)
      .preload('principal')
      .preload('requisitions', (query) => {
        query.preload('applicant').preload('items', (q) => q.preload('reagent')).orderBy('created_at', 'desc')
      })
      .first()

    if (!project) {
      return response.notFound({ message: '项目未找到' })
    }

    const totalRequisitions = project.requisitions.length
    const totalSpent = project.requisitions
      .filter((r) => r.status === 'approved' || r.status === 'completed')
      .reduce((sum, r) => {
        return sum + r.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0)
      }, 0)

    return response.ok({
      project,
      summary: {
        totalRequisitions,
        totalSpent,
        budgetRemaining: Number(project.budget) - Number(project.spent),
        budgetUtilization: Number(project.budget) > 0 ? (Number(project.spent) / Number(project.budget)) * 100 : 0,
      },
    })
  }
}
