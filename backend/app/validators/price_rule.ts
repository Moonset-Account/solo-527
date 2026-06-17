import vine from '@vinejs/vine'

export const createPriceRuleValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100),
    deviceType: vine.string().maxLength(50),
    basePrice: vine.number().min(0),
    description: vine.string().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const updatePriceRuleValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).optional(),
    deviceType: vine.string().maxLength(50).optional(),
    basePrice: vine.number().min(0).optional(),
    description: vine.string().optional(),
    isActive: vine.boolean().optional(),
  })
)
