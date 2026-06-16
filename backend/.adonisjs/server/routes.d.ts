import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.todos': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.assign_roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.get_roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.store': { paramsTuple?: []; params?: {} }
    'roles.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.assign_permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.index': { paramsTuple?: []; params?: {} }
    'plans.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.store': { paramsTuple?: []; params?: {} }
    'plans.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.index': { paramsTuple?: []; params?: {} }
    'seats.seats.idle_list': { paramsTuple?: []; params?: {} }
    'seats.seats.batch_query': { paramsTuple?: []; params?: {} }
    'seats.seats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.store': { paramsTuple?: []; params?: {} }
    'seats.seats.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.get_notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.add_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.update_idle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usage.usage.trends': { paramsTuple?: []; params?: {} }
    'usage.usage.records': { paramsTuple?: []; params?: {} }
    'usage.usage.errors': { paramsTuple?: []; params?: {} }
    'usage.usage.summary': { paramsTuple?: []; params?: {} }
    'usage.usage.seat_usage': { paramsTuple: [ParamValue]; params: {'seatId': ParamValue} }
    'bills.bills.index': { paramsTuple?: []; params?: {} }
    'bills.bills.export': { paramsTuple?: []; params?: {} }
    'bills.bills.generate': { paramsTuple?: []; params?: {} }
    'bills.bills.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bills.bills.store': { paramsTuple?: []; params?: {} }
    'bills.bills.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bills.bills.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.index': { paramsTuple?: []; params?: {} }
    'billing_cycles.billing_cycles.store': { paramsTuple?: []; params?: {} }
    'billing_cycles.billing_cycles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.set_default': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.index': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.stats': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.export': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.batch_import': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.store': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.follow_up': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.todos': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.get_roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.index': { paramsTuple?: []; params?: {} }
    'plans.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.index': { paramsTuple?: []; params?: {} }
    'seats.seats.idle_list': { paramsTuple?: []; params?: {} }
    'seats.seats.batch_query': { paramsTuple?: []; params?: {} }
    'seats.seats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.get_notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usage.usage.trends': { paramsTuple?: []; params?: {} }
    'usage.usage.records': { paramsTuple?: []; params?: {} }
    'usage.usage.errors': { paramsTuple?: []; params?: {} }
    'usage.usage.summary': { paramsTuple?: []; params?: {} }
    'usage.usage.seat_usage': { paramsTuple: [ParamValue]; params: {'seatId': ParamValue} }
    'bills.bills.index': { paramsTuple?: []; params?: {} }
    'bills.bills.export': { paramsTuple?: []; params?: {} }
    'bills.bills.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.index': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.index': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.stats': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.export': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.todos': { paramsTuple?: []; params?: {} }
    'dashboard.dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.get_roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.index': { paramsTuple?: []; params?: {} }
    'plans.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.index': { paramsTuple?: []; params?: {} }
    'seats.seats.idle_list': { paramsTuple?: []; params?: {} }
    'seats.seats.batch_query': { paramsTuple?: []; params?: {} }
    'seats.seats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.get_notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usage.usage.trends': { paramsTuple?: []; params?: {} }
    'usage.usage.records': { paramsTuple?: []; params?: {} }
    'usage.usage.errors': { paramsTuple?: []; params?: {} }
    'usage.usage.summary': { paramsTuple?: []; params?: {} }
    'usage.usage.seat_usage': { paramsTuple: [ParamValue]; params: {'seatId': ParamValue} }
    'bills.bills.index': { paramsTuple?: []; params?: {} }
    'bills.bills.export': { paramsTuple?: []; params?: {} }
    'bills.bills.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.index': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.index': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.stats': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.export': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'users.users.assign_roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.store': { paramsTuple?: []; params?: {} }
    'roles.roles.assign_permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.store': { paramsTuple?: []; params?: {} }
    'seats.seats.store': { paramsTuple?: []; params?: {} }
    'seats.seats.add_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bills.bills.generate': { paramsTuple?: []; params?: {} }
    'bills.bills.store': { paramsTuple?: []; params?: {} }
    'billing_cycles.billing_cycles.store': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.batch_import': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.store': { paramsTuple?: []; params?: {} }
    'renewal_lists.renewal_lists.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.follow_up': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bills.bills.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'users.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'plans.plans.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seats.seats.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bills.bills.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'renewal_lists.renewal_lists.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'seats.seats.update_idle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'billing_cycles.billing_cycles.set_default': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}