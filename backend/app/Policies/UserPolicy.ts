import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'

export default class UserPolicy extends BasePolicy {
  public async viewList(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }

  public async view(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }

  public async create(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }

  public async update(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }

  public async delete(user: User) {
    const roles = await user.related('roles').query()
    return roles.some((role) => role.slug === 'admin')
  }
}
