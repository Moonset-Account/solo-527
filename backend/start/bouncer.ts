/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
*/

export const policies: Record<string, string> = {
  workOrder: 'App/Policies/WorkOrderPolicy',
  user: 'App/Policies/UserPolicy',
}

export const actions: Record<string, any> = {}
