import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    deviceType: vine.string().maxLength(50),
    faultDescription: vine.string().optional(),
    faultPhotos: vine.array(vine.string()).optional(),
    address: vine.string().maxLength(255),
    contactName: vine.string().maxLength(50),
    contactPhone: vine.string().mobile(),
    appointmentTime: vine.date(),
    communityId: vine.number().optional(),
    channel: vine.string().maxLength(50).optional(),
    remark: vine.string().optional(),
  })
)

export const updateOrderValidator = vine.compile(
  vine.object({
    deviceType: vine.string().maxLength(50).optional(),
    faultDescription: vine.string().optional(),
    faultPhotos: vine.array(vine.string()).optional(),
    address: vine.string().maxLength(255).optional(),
    contactName: vine.string().maxLength(50).optional(),
    contactPhone: vine.string().mobile().optional(),
    appointmentTime: vine.date().optional(),
    status: vine.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
    price: vine.number().optional(),
    remark: vine.string().optional(),
  })
)

export const assignOrderValidator = vine.compile(
  vine.object({
    technicianId: vine.number(),
  })
)

export const rescheduleValidator = vine.compile(
  vine.object({
    appointmentTime: vine.date(),
    reason: vine.string().optional(),
  })
)

export const cancelOrderValidator = vine.compile(
  vine.object({
    reason: vine.string().optional(),
  })
)

export const orderListValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
    status: vine.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
    keyword: vine.string().optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
  })
)
