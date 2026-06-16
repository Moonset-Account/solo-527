import vine from '@vinejs/vine'

export const createSeatSchema = vine.create({
  customerId: vine.string().maxLength(255),
  customerName: vine.string().maxLength(255),
  planId: vine.number().positive(),
  seatCode: vine.string().maxLength(100).unique({ table: 'seats', column: 'seat_code' }),
  status: vine.string().in(['active', 'trial', 'suspended', 'cancelled']).optional(),
  billingCycle: vine.string().in(['monthly', 'yearly']).optional(),
  startDate: vine.date(),
  endDate: vine.date().nullable().optional(),
  trialEndDate: vine.date().nullable().optional(),
  apiCallsLimit: vine.number().positive().optional(),
  notes: vine.string().nullable().optional(),
})

export const updateSeatSchema = vine.create({
  customerId: vine.string().maxLength(255).optional(),
  customerName: vine.string().maxLength(255).optional(),
  planId: vine.number().positive().optional(),
  seatCode: vine
    .string()
    .maxLength(100)
    .unique({ table: 'seats', column: 'seat_code' })
    .optional(),
  status: vine.string().in(['active', 'trial', 'suspended', 'cancelled']).optional(),
  billingCycle: vine.string().in(['monthly', 'yearly']).optional(),
  startDate: vine.date().optional(),
  endDate: vine.date().nullable().optional(),
  trialEndDate: vine.date().nullable().optional(),
  apiCallsLimit: vine.number().positive().optional(),
  notes: vine.string().nullable().optional(),
})

export const querySeatSchema = vine.create({
  page: vine.number().positive().optional(),
  perPage: vine.number().positive().max(100).optional(),
  keyword: vine.string().maxLength(255).optional(),
  status: vine.string().in(['active', 'trial', 'suspended', 'cancelled']).optional(),
  planId: vine.number().positive().optional(),
  isIdle: vine.boolean().optional(),
  customerIds: vine.array(vine.string().maxLength(255)).optional(),
  sortBy: vine.string().maxLength(100).optional(),
  sortOrder: vine.string().in(['asc', 'desc']).optional(),
})

export const noteSchema = vine.create({
  type: vine.string().in(['note', 'warning', 'action', 'system']).optional(),
  content: vine.string().minLength(1).maxLength(2000),
  result: vine.string().maxLength(1000).nullable().optional(),
})
