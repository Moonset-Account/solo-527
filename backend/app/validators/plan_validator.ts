import vine from '@vinejs/vine'

export const createPlanValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    code: vine.string().maxLength(100).unique({ table: 'plans', column: 'code' }),
    description: vine.string().nullable().optional(),
    priceMonthly: vine.number().positive(),
    priceYearly: vine.number().positive(),
    apiCallsLimit: vine.number().positive(),
    seatLimit: vine.number().positive(),
    features: vine.object({}).optional(),
    status: vine.enum(['active', 'inactive']).optional(),
    sortOrder: vine.number().optional(),
  })
)

export const updatePlanValidator = vine.compile(
  vine.object({
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
    status: vine.enum(['active', 'inactive']).optional(),
    sortOrder: vine.number().optional(),
  })
)

export const queryPlanValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    status: vine.enum(['active', 'inactive']).optional(),
    keyword: vine.string().maxLength(255).optional(),
    sortBy: vine.string().maxLength(100).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
