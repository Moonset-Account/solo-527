import Project from '#models/project'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class FinanceController {
  async balances({ response }: HttpContext) {
    const projects = await Project.query().preload('principal')

    const balances = projects.map((project) => ({
      id: project.id,
      name: project.name,
      principal: project.principal.displayName,
      budget: Number(project.budget),
      spent: Number(project.spent),
      remaining: Number(project.budget) - Number(project.spent),
      status: project.status,
    }))

    return response.ok(balances)
  }

  async allocate({ request, response }: HttpContext) {
    const { projectId, amount } = request.only(['projectId', 'amount'])

    const project = await Project.findOrFail(projectId)
    project.budget = Number(project.budget) + Number(amount)
    await project.save()

    return response.ok(project)
  }

  async stats({ response }: HttpContext) {
    const result = await Project.query()
      .select(db.raw('SUM(budget) as total_budget'), db.raw('SUM(spent) as total_spent'))
      .first()

    const totalBudget = Number(result?.$extras.total_budget ?? 0)
    const totalSpent = Number(result?.$extras.total_spent ?? 0)

    const activeProjects = await Project.query().where('status', 'active').count('* as total').first()
    const suspendedProjects = await Project.query().where('status', 'suspended').count('* as total').first()

    return response.ok({
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      activeProjectCount: Number(activeProjects?.$extras.total ?? 0),
      suspendedProjectCount: Number(suspendedProjects?.$extras.total ?? 0),
    })
  }
}
