import vine from '@vinejs/vine'

export const updateConfigValidator = vine.compile(
  vine.object({
    value: vine.string().optional(),
    description: vine.string().optional(),
    changeReason: vine.string().optional(),
  })
)

export const configHistoryValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
    configKey: vine.string().optional(),
  })
)
