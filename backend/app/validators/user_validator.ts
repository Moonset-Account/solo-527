import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const indexUserValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  keyword: vine.string().trim().maxLength(100).optional(),
  status: vine.string().optional(),
})

export const storeUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().nullable().maxLength(100),
    email: email().unique({ table: 'users', column: 'email' }),
    password: password(),
    passwordConfirmation: password().sameAs('password'),
    phone: vine.string().nullable().maxLength(20),
    department: vine.string().nullable().maxLength(100),
    status: vine.enum(['active', 'inactive']).optional(),
    roleIds: vine.array(vine.number().positive()).optional(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().nullable().maxLength(100),
    email: email().unique({ table: 'users', column: 'email', caseInsensitive: true }),
    password: password().optional(),
    phone: vine.string().nullable().maxLength(20),
    department: vine.string().nullable().maxLength(100),
    status: vine.enum(['active', 'inactive']).optional(),
  })
)

export const assignRolesValidator = vine.compile(
  vine.object({
    roleIds: vine.array(vine.number().positive()),
  })
)
