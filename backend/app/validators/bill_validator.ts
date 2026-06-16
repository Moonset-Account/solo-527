import vine from '@vinejs/vine'

export const createBillSchema = vine.create({
  seatId: vine.number().positive(),
  billingMonth: vine.string(),
  periodStart: vine.string(),
  periodEnd: vine.string(),
  amount: vine.number().min(0),
  apiCallsUsed: vine.number().min(0).optional(),
  status: vine.string().optional(),
  dueDate: vine.string().optional(),
  remark: vine.string().optional(),
})

export const updateBillSchema = vine.create({
  status: vine.string().optional(),
  amount: vine.number().min(0).optional(),
  dueDate: vine.string().optional(),
  paidAt: vine.string().optional(),
  remark: vine.string().optional(),
  apiCallsUsed: vine.number().min(0).optional(),
})

export const queryBillSchema = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  seatId: vine.number().positive().optional(),
  customerId: vine.string().optional(),
  customerName: vine.string().optional(),
  status: vine.string().optional(),
  billingMonth: vine.string().optional(),
  startDate: vine.string().optional(),
  endDate: vine.string().optional(),
  keyword: vine.string().optional(),
})

export const generateBillsSchema = vine.create({
  billingMonth: vine.string(),
  seatIds: vine.array(vine.number().positive()).optional(),
})
