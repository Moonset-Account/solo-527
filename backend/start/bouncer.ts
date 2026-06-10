/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
*/

import { Bouncer } from '@adonisjs/bouncer/build/standalone'
import WorkOrderPolicy from 'App/Policies/WorkOrderPolicy'
import UserPolicy from 'App/Policies/UserPolicy'

export const { actions, policies, gates, ...bouncer } = Bouncer.configure({
  policies: {
    workOrder: WorkOrderPolicy,
    user: UserPolicy,
  },
})

declare module '@ioc:Adonis/Addons/Bouncer' {
  interface BouncerContracts {
    policies: {
      workOrder: WorkOrderPolicy
      user: UserPolicy
    }
  }
}
