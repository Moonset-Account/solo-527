import vine from '@vinejs/vine'

export const indexRoleValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  keyword: vine.string().trim().maxLength(100).optional(),
})

export const storeRoleValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).unique({ table: 'roles', column: 'name' }),
    displayName: vine.string().maxLength(100),
    description: vine.string().nullable().maxLength(500),
    permissionIds: vine.array(vine.number().positive()).optional(),
  })
)

export const updateRoleValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).unique({ table: 'roles', column: 'name', caseInsensitive: true }),
    displayName: vine.string().maxLength(100),
    description: vine.string().nullable().maxLength(500),
  })
)

export const assignPermissionsValidator = vine.compile(
  vine.object({
    permissionIds: vine.array(vine.number().positive()),
  })
)
