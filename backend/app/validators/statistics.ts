import vine from '@vinejs/vine'

export const createEvaluationValidator = vine.compile(
  vine.object({
    orderId: vine.number(),
    rating: vine.number().min(1).max(5),
    content: vine.string().optional(),
    isRepurchase: vine.boolean().optional(),
    channel: vine.string().maxLength(50).optional(),
  })
)

export const repurchaseStatsValidator = vine.compile(
  vine.object({
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
    groupBy: vine.enum(['community', 'date', 'channel']).optional(),
  })
)

export const technicianLoadValidator = vine.compile(
  vine.object({
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
    period: vine.enum(['day', 'week', 'month']).optional(),
    technicianId: vine.number().optional(),
  })
)

export const lateReasonStatsValidator = vine.compile(
  vine.object({
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
  })
)
