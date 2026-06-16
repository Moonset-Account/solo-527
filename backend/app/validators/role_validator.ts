import vine from '@vinejs/vine'

export const indexRoleValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
    keyword: vine.string().trim().maxLength(100).optional(),
  })
)

export const storeRoleValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).unique({ table: 'roles', column: 'name' }),
    displayName: vine.string().maxLength(100),
    description: vine.string().maxLength(500).optional(),
    permissionIds: vine.array(vine.number().positive()).optional(),
  })
)

export const updateRoleValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .maxLength(100)
      .unique({ table: 'roles', column: 'name', caseInsensitive: true })
      .optional(),
    displayName: vine.string().maxLength(100).optional(),
    description: vine.string().maxLength(500).optional(),
  })
)

export const assignPermissionsValidator = vine.compile(
  vine.object({
    permissionIds: vine.array(vine.number().positive()),
  })
)
