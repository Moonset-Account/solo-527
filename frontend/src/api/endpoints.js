const API_BASE = '/api';

export const AUTH = {
  LOGIN: `${API_BASE}/auth/users/login/`,
  LOGOUT: `${API_BASE}/auth/users/logout/`,
  REFRESH_TOKEN: `${API_BASE}/auth/token/refresh/`,
  CURRENT_USER: `${API_BASE}/auth/users/me/`,
  USERS: `${API_BASE}/auth/users/`,
  USER_DETAIL: (id) => `${API_BASE}/auth/users/${id}/`,
  STAFF_PROFILES: `${API_BASE}/auth/staff-profiles/`,
  STAFF_PROFILE_DETAIL: (id) => `${API_BASE}/auth/staff-profiles/${id}/`,
  MEMBER_PROFILES: `${API_BASE}/auth/member-profiles/`,
  MEMBER_PROFILE_DETAIL: (id) => `${API_BASE}/auth/member-profiles/${id}/`,
  VEHICLES: `${API_BASE}/auth/vehicles/`,
  VEHICLE_DETAIL: (id) => `${API_BASE}/auth/vehicles/${id}/`,
};

export const MEMBERSHIP = {
  BENEFITS: `${API_BASE}/membership/benefits/`,
  BENEFIT_DETAIL: (id) => `${API_BASE}/membership/benefits/${id}/`,
  PACKAGES: `${API_BASE}/membership/packages/`,
  PACKAGE_DETAIL: (id) => `${API_BASE}/membership/packages/${id}/`,
  PACKAGE_BENEFITS: `${API_BASE}/membership/package-benefits/`,
  PACKAGE_BENEFIT_DETAIL: (id) => `${API_BASE}/membership/package-benefits/${id}/`,
  MEMBER_MEMBERSHIPS: `${API_BASE}/membership/member-memberships/`,
  MEMBER_MEMBERSHIP_DETAIL: (id) => `${API_BASE}/membership/member-memberships/${id}/`,
  USAGE_RECORDS: `${API_BASE}/membership/usage-records/`,
  USAGE_RECORD_DETAIL: (id) => `${API_BASE}/membership/usage-records/${id}/`,
};

export const SERVICES = {
  CATEGORIES: `${API_BASE}/services/categories/`,
  CATEGORY_DETAIL: (id) => `${API_BASE}/services/categories/${id}/`,
  ITEMS: `${API_BASE}/services/items/`,
  ITEM_DETAIL: (id) => `${API_BASE}/services/items/${id}/`,
  TEST_DRIVE_SLOTS: `${API_BASE}/services/test-drive-slots/`,
  TEST_DRIVE_SLOT_DETAIL: (id) => `${API_BASE}/services/test-drive-slots/${id}/`,
  RECORDS: `${API_BASE}/services/records/`,
  RECORD_DETAIL: (id) => `${API_BASE}/services/records/${id}/`,
};

export const BOOKINGS = {
  BOOKINGS: `${API_BASE}/bookings/bookings/`,
  BOOKING_DETAIL: (id) => `${API_BASE}/bookings/bookings/${id}/`,
  REMINDERS: `${API_BASE}/bookings/reminders/`,
  REMINDER_DETAIL: (id) => `${API_BASE}/bookings/reminders/${id}/`,
  TIME_SLOTS: `${API_BASE}/bookings/time-slots/`,
  TIME_SLOT_DETAIL: (id) => `${API_BASE}/bookings/time-slots/${id}/`,
};

export const PAYMENTS = {
  ORDERS: `${API_BASE}/payments/orders/`,
  ORDER_DETAIL: (id) => `${API_BASE}/payments/orders/${id}/`,
  PROCESS_PAYMENT: (id) => `${API_BASE}/payments/orders/${id}/process-payment/`,
  CANCEL_ORDER: (id) => `${API_BASE}/payments/orders/${id}/cancel/`,
  MARK_DISCREPANCY: (id) => `${API_BASE}/payments/orders/${id}/mark-discrepancy/`,
  RESOLVE_DISCREPANCY: (id) => `${API_BASE}/payments/orders/${id}/resolve-discrepancy/`,
  REFUND: (id) => `${API_BASE}/payments/orders/${id}/refund/`,
  TRANSACTIONS: `${API_BASE}/payments/transactions/`,
  TRANSACTION_DETAIL: (id) => `${API_BASE}/payments/transactions/${id}/`,
  SHIFTS: `${API_BASE}/payments/shifts/`,
  SHIFT_DETAIL: (id) => `${API_BASE}/payments/shifts/${id}/`,
  SHIFT_OPEN: `${API_BASE}/payments/shifts/open-shift/`,
  SHIFT_CURRENT: `${API_BASE}/payments/shifts/current-shift/`,
  SHIFT_CLOSE: (id) => `${API_BASE}/payments/shifts/${id}/close-shift/`,
  SHIFT_RECONCILE: (id) => `${API_BASE}/payments/shifts/${id}/reconcile/`,
  SHIFT_SUMMARY: (id) => `${API_BASE}/payments/shifts/${id}/shift-summary/`,
  CASHIER_DISCREPANCY: `${API_BASE}/payments/orders/`,
};

export const CONVERSION = {
  FUNNELS: `${API_BASE}/conversion/funnels/`,
  FUNNEL_DETAIL: (id) => `${API_BASE}/conversion/funnels/${id}/`,
  REPORTS: `${API_BASE}/conversion/reports/`,
  REPORT_DETAIL: (id) => `${API_BASE}/conversion/reports/${id}/`,
  REMINDERS: `${API_BASE}/conversion/reminders/`,
  REMINDER_DETAIL: (id) => `${API_BASE}/conversion/reminders/${id}/`,
  PERFORMANCE: `${API_BASE}/conversion/performance/`,
  PERFORMANCE_DETAIL: (id) => `${API_BASE}/conversion/performance/${id}/`,
  EXPORT_REPORT: `${API_BASE}/conversion/reports/export/`,
};

export const DASHBOARD = {
  DATA: `${API_BASE}/dashboard/data/`,
  WIDGETS: `${API_BASE}/dashboard/widgets/`,
  WIDGET_DETAIL: (id) => `${API_BASE}/dashboard/widgets/${id}/`,
  LAYOUTS: `${API_BASE}/dashboard/layouts/`,
  LAYOUT_DETAIL: (id) => `${API_BASE}/dashboard/layouts/${id}/`,
  LAYOUT_WIDGETS: `${API_BASE}/dashboard/layout-widgets/`,
  LAYOUT_WIDGET_DETAIL: (id) => `${API_BASE}/dashboard/layout-widgets/${id}/`,
  ALERTS: `${API_BASE}/dashboard/alerts/`,
  ALERT_DETAIL: (id) => `${API_BASE}/dashboard/alerts/${id}/`,
};

export default {
  AUTH,
  MEMBERSHIP,
  SERVICES,
  BOOKINGS,
  PAYMENTS,
  CONVERSION,
  DASHBOARD,
};
