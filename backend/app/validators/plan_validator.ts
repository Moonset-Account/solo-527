import vine from '@vinejs/vine'

export const createPlanSchema = vine.create({
  name: vine.string().maxLength(255),
  code: vine.string().maxLength(100).unique({ table: 'plans', column: 'code' }),
  description: vine.string().nullable().optional(),
  priceMonthly: vine.number().positive(),
  priceYearly: vine.number().positive(),
  apiCallsLimit: vine.number().positive(),
  seatLimit: vine.number().positive(),
  features: vine.object({}).optional(),
  status: vine.string().in(['active', 'inactive']).optional(),
  sortOrder: vine.number().optional(),
})

export const updatePlanSchema = vine.create({
  name: vine.string().maxLength(255).optional(),
  code: vine
    .string()
    .maxLength(100)
    .unique({ table: 'plans', column: 'code' })
    .optional(),
  description: vine.string().nullable().optional(),
  priceMonthly: vine.number().positive().optional(),
  priceYearly: vine.number().positive().optional(),
  apiCallsLimit: vine.number().positive().optional(),
  seatLimit: vine.number().positive().optional(),
  features: vine.object({}).optional(),
  status: vine.string().in(['active', 'inactive']).optional(),
  sortOrder: vine.number().optional(),
})

export const queryPlanSchema = vine.create({
  page: vine.number().positive().optional(),
  perPage: vine.number().positive().max(100).optional(),
  status: vine.string().in(['active', 'inactive']).optional(),
  keyword: vine.string().maxLength(255).optional(),
  sortBy: vine.string().maxLength(100).optional(),
  sortOrder: vine.string().in(['asc', 'desc']).optional(),
})
