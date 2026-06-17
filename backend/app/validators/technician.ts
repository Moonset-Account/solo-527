import vine from '@vinejs/vine'

export const createTechnicianValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(50),
    phone: vine.string().mobile(),
    skills: vine.array(vine.string()).optional(),
    dailyLimit: vine.number().min(1).max(20).optional(),
    status: vine.enum(['active', 'inactive', 'on_leave']).optional(),
    userId: vine.number().optional(),
  })
)

export const updateTechnicianValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(50).optional(),
    phone: vine.string().mobile().optional(),
    skills: vine.array(vine.string()).optional(),
    dailyLimit: vine.number().min(1).max(20).optional(),
    status: vine.enum(['active', 'inactive', 'on_leave']).optional(),
    userId: vine.number().optional(),
  })
)
