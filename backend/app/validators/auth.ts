import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(50),
    phone: vine.string().mobile(),
    email: vine.string().email().optional(),
    password: vine.string().minLength(6).maxLength(50),
    role: vine.enum(['user', 'technician']).optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    account: vine.string(),
    password: vine.string(),
  })
)
