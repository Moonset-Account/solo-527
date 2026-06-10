/**
 * Contract source: https://git.io/Jte3T
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

declare module '@ioc:Adonis/Addons/Bouncer' {
  interface ActionsList {}

  interface PoliciesList {
    workOrder: typeof import('App/Policies/WorkOrderPolicy').default
    user: typeof import('App/Policies/UserPolicy').default
  }
}
