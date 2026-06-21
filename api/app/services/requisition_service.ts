import Requisition from '#models/requisition'
import RequisitionItem from '#models/requisition_item'
import Reagent from '#models/reagent'
import Project from '#models/project'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export class RequisitionService {
  async validateStock(items: { reagentId: string; quantity: number }[]) {
    const errors: string[] = []
    for (const item of items) {
      const reagent = await Reagent.find(item.reagentId)
      if (!reagent) {
        errors.push(`试剂 ${item.reagentId} 不存在`)
        continue
      }
      if (reagent.totalQuantity < item.quantity) {
        errors.push(`试剂 ${reagent.name} 库存不足，当前库存 ${reagent.totalQuantity}，申请数量 ${item.quantity}`)
      }
    }
    return errors
  }

  async validateBudget(projectId: string, totalAmount: number) {
    const project = await Project.find(projectId)
    if (!project) {
      return `项目 ${projectId} 不存在`
    }
    const remaining = Number(project.budget) - Number(project.spent)
    if (remaining < totalAmount) {
      return `项目 ${project.name} 预算不足，剩余预算 ${remaining}，申请金额 ${totalAmount}`
    }
    return null
  }

  async processApproval(requisitionId: string, reviewerId: string, approved: boolean, comment?: string) {
    const requisition = await Requisition.findOrFail(requisitionId)
    if (requisition.status !== 'pending') {
      throw new Error('该申请已被处理')
    }

    const trx = await db.transaction()
    try {
      requisition.useTransaction(trx)
      requisition.reviewerId = reviewerId
      requisition.reviewComment = comment || null
      requisition.reviewedAt = DateTime.now()

      if (approved) {
        requisition.status = 'approved'
        await this.deductStock(requisitionId, trx)
      } else {
        requisition.status = 'rejected'
      }

      await requisition.save()
      await trx.commit()
      return requisition
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async deductStock(requisitionId: string, trx: any) {
    const items = await RequisitionItem.query({ client: trx })
      .where('requisition_id', requisitionId)

    let totalSpent = 0

    for (const item of items) {
      const reagent = await Reagent.query({ client: trx })
        .where('id', item.reagentId)
        .firstOrFail()

      reagent.useTransaction(trx)
      reagent.totalQuantity -= item.quantity
      totalSpent += Number(item.unitPrice) * item.quantity
      await reagent.save()
    }

    const requisition = await Requisition.query({ client: trx })
      .where('id', requisitionId)
      .firstOrFail()

    const project = await Project.query({ client: trx })
      .where('id', requisition.projectId)
      .firstOrFail()

    project.useTransaction(trx)
    project.spent = Number(project.spent) + totalSpent
    await project.save()
  }
}
