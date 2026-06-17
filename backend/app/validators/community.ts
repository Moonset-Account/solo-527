import vine from '@vinejs/vine'

export const createCommunityValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100),
    district: vine.string().maxLength(50).optional(),
    address: vine.string().maxLength(255).optional(),
  })
)

export const updateCommunityValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).optional(),
    district: vine.string().maxLength(50).optional(),
    address: vine.string().maxLength(255).optional(),
  })
)
