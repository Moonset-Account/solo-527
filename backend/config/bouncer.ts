/**
 * Config source: https://git.io/Jte3v
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import type { BouncerConfig } from '@ioc:Adonis/Addons/Bouncer'

const bouncerConfig: BouncerConfig = {
  resolver: {
    policies: {
      workOrder: 'App/Policies/WorkOrderPolicy',
      user: 'App/Policies/UserPolicy',
    },
    actions: {},
  },
}

export default bouncerConfig
