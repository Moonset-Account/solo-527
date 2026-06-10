import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import WorkOrder from 'App/Models/WorkOrder'

export default class WorkOrderPolicy extends BasePolicy {
  public async viewList(user: User) {
    return true
  }

  public async view(user: User, workOrder: WorkOrder) {
    return true
  }

  public async create(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => ['admin', 'workshop_manager'].includes(role.slug))
  }

  public async update(user: User, workOrder: WorkOrder) {
    const roles = await user.related('roles').query()
    return roles.some((role) => ['admin', 'workshop_manager'].includes(role.slug))
  }

  public async delete(user: User, workOrder: WorkOrder) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }

  public async updateStatus(user: User, workOrder: WorkOrder) {
    const roles = await user.related('roles').query()
    return roles.some((role) => ['admin', 'workshop_manager'].includes(role.slug))
  }
}
