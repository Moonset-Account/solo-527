import vine from '@vinejs/vine'

export const createBillingCycleValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(50),
    cycleType: vine.string().in(['monthly', 'quarterly', 'yearly']).optional(),
    dayOfMonth: vine.number().min(1).max(31).optional(),
    status: vine.string().in(['active', 'inactive']).optional(),
  })
)

export const updateBillingCycleValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(50).optional(),
    cycleType: vine.string().in(['monthly', 'quarterly', 'yearly']).optional(),
    dayOfMonth: vine.number().min(1).max(31).optional(),
    status: vine.string().in(['active', 'inactive']).optional(),
  })
)

export const queryBillingCycleValidator = vine.compile(
  vine.object({
    status: vine.string().in(['active', 'inactive']).optional(),
  })
)
