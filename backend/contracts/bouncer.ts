/**
 * Contract source: https://git.io/Jte3T
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import WorkOrderPolicy from 'App/Policies/WorkOrderPolicy'
import UserPolicy from 'App/Policies/UserPolicy'

declare module '@ioc:Adonis/Addons/Bouncer' {
  interface BouncerContracts {
    policies: {
      workOrder: WorkOrderPolicy
      user: UserPolicy
    }
  }
}
