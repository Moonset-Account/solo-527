import vine from '@vinejs/vine'

export const createBillValidator = vine.compile(
  vine.object({
    seatId: vine.number().positive(),
    billingMonth: vine.string(),
    periodStart: vine.string(),
    periodEnd: vine.string(),
    amount: vine.number().min(0),
    apiCallsUsed: vine.number().min(0).optional(),
    status: vine.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
    dueDate: vine.string().optional(),
    remark: vine.string().optional(),
  })
)

export const updateBillValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
    amount: vine.number().min(0).optional(),
    dueDate: vine.string().optional(),
    paidAt: vine.string().optional(),
    remark: vine.string().optional(),
    apiCallsUsed: vine.number().min(0).optional(),
  })
)

export const queryBillValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
    seatId: vine.number().positive().optional(),
    customerId: vine.string().optional(),
    customerName: vine.string().optional(),
    status: vine.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
    billingMonth: vine.string().optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
    keyword: vine.string().optional(),
  })
)

export const generateBillsValidator = vine.compile(
  vine.object({
    billingMonth: vine.string(),
    seatIds: vine.array(vine.number().positive()).optional(),
  })
)
