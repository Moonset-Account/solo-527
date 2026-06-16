import vine from '@vinejs/vine'

export const createSeatValidator = vine.compile(
  vine.object({
    customerId: vine.string().maxLength(255),
    customerName: vine.string().maxLength(255),
    planId: vine.number().positive(),
    seatCode: vine.string().maxLength(100).unique({ table: 'seats', column: 'seat_code' }),
    status: vine.enum(['active', 'trial', 'suspended', 'cancelled']).optional(),
    billingCycle: vine.enum(['monthly', 'yearly']).optional(),
    startDate: vine.date(),
    endDate: vine.date().optional(),
    trialEndDate: vine.date().optional(),
    apiCallsLimit: vine.number().positive().optional(),
    notes: vine.string().optional(),
  })
)

export const updateSeatValidator = vine.compile(
  vine.object({
    customerId: vine.string().maxLength(255).optional(),
    customerName: vine.string().maxLength(255).optional(),
    planId: vine.number().positive().optional(),
    seatCode: vine
      .string()
      .maxLength(100)
      .unique({ table: 'seats', column: 'seat_code' })
      .optional(),
    status: vine.enum(['active', 'trial', 'suspended', 'cancelled']).optional(),
    billingCycle: vine.enum(['monthly', 'yearly']).optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
    trialEndDate: vine.date().optional(),
    apiCallsLimit: vine.number().positive().optional(),
    notes: vine.string().optional(),
  })
)

export const querySeatValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    keyword: vine.string().maxLength(255).optional(),
    status: vine.enum(['active', 'trial', 'suspended', 'cancelled']).optional(),
    planId: vine.number().positive().optional(),
    isIdle: vine.boolean().optional(),
    customerIds: vine.array(vine.string().maxLength(255)).optional(),
    sortBy: vine.string().maxLength(100).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

export const noteValidator = vine.compile(
  vine.object({
    type: vine.enum(['note', 'warning', 'action', 'system']).optional(),
    content: vine.string().minLength(1).maxLength(2000),
    result: vine.string().maxLength(1000).optional(),
  })
)
