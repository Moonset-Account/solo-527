import vine from '@vinejs/vine'

export const indexRenewalListValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
    status: vine.string().optional(),
    priority: vine.string().optional(),
    assignedTo: vine.number().positive().optional(),
    keyword: vine.string().trim().maxLength(100).optional(),
    sortBy: vine.string().optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

export const storeRenewalListValidator = vine.compile(
  vine.object({
    seatId: vine.number().positive().unique({ table: 'renewal_list', column: 'seat_id' }),
    customerId: vine.string().maxLength(100),
    customerName: vine.string().maxLength(200),
    planName: vine.string().maxLength(100),
    expiryDate: vine.date(),
    status: vine.enum(['pending', 'following', 'converted', 'lost']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignedTo: vine.number().positive().optional(),
    nextFollowUpAt: vine.date().optional(),
    notes: vine.string().maxLength(1000).optional(),
  })
)

export const updateRenewalListValidator = vine.compile(
  vine.object({
    customerId: vine.string().maxLength(100).optional(),
    customerName: vine.string().maxLength(200).optional(),
    planName: vine.string().maxLength(100).optional(),
    expiryDate: vine.date().optional(),
    status: vine.enum(['pending', 'following', 'converted', 'lost']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    nextFollowUpAt: vine.date().optional(),
    notes: vine.string().maxLength(1000).optional(),
  })
)

export const assignRenewalListValidator = vine.compile(
  vine.object({
    assignedTo: vine.number().positive(),
  })
)

export const followUpValidator = vine.compile(
  vine.object({
    content: vine.string().maxLength(1000),
    nextFollowUpAt: vine.date().optional(),
    status: vine.enum(['pending', 'following', 'converted', 'lost']).optional(),
  })
)

export const batchImportValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        seatId: vine.number().positive(),
        customerId: vine.string().maxLength(100),
        customerName: vine.string().maxLength(200),
        planName: vine.string().maxLength(100),
        expiryDate: vine.date(),
        priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
      })
    ),
  })
)
