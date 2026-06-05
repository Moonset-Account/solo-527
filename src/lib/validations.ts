import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
});

export const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(50, '姓名最多50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string(),
  studentId: z.string().optional(),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export const productionSchema = z.object({
  title: z.string().min(1, '请输入剧目名称').max(200, '剧目名称最多200个字符'),
  description: z.string().optional(),
  posterUrl: z.string().url('请输入有效的图片地址').optional().or(z.literal('')),
  author: z.string().optional(),
  director: z.string().optional(),
  status: z.enum(['DRAFT', 'REHEARSING', 'PERFORMING', 'COMPLETED']).default('DRAFT'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const characterSchema = z.object({
  name: z.string().min(1, '请输入角色名称').max(100, '角色名称最多100个字符'),
  description: z.string().optional(),
  actorId: z.string().optional(),
  order: z.number().int().default(0),
});

export const venueSchema = z.object({
  name: z.string().min(1, '请输入场地名称').max(100, '场地名称最多100个字符'),
  location: z.string().optional(),
  capacity: z.number().int().min(0, '容量不能为负数').default(0),
  type: z.enum(['REHEARSAL', 'PERFORMANCE']).default('REHEARSAL'),
  facilities: z.string().optional(),
});

export const rehearsalSchema = z.object({
  productionId: z.string().min(1, '请选择剧目'),
  venueId: z.string().min(1, '请选择场地'),
  title: z.string().min(1, '请输入排练标题').max(200, '标题最多200个字符'),
  startTime: z.string().min(1, '请选择开始时间'),
  endTime: z.string().min(1, '请选择结束时间'),
  content: z.string().optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: '结束时间必须晚于开始时间',
  path: ['endTime'],
});

export const leaveSchema = z.object({
  rehearsalId: z.string().min(1, '请选择排练'),
  reason: z.string().min(5, '请假原因至少5个字符'),
});

export const showSchema = z.object({
  productionId: z.string().min(1, '请选择剧目'),
  venueId: z.string().min(1, '请选择场地'),
  startTime: z.string().min(1, '请选择开始时间'),
  endTime: z.string().min(1, '请选择结束时间'),
  isSaleOpen: z.boolean().default(false),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: '结束时间必须晚于开始时间',
  path: ['endTime'],
});

export const ticketTierSchema = z.object({
  name: z.string().min(1, '请输入票档名称').max(50, '票档名称最多50个字符'),
  price: z.number().min(0, '价格不能为负数'),
  color: z.string().optional(),
  totalSeats: z.number().int().min(0, '座位数不能为负数').default(0),
});

export const orderSchema = z.object({
  showId: z.string().min(1, '请选择场次'),
  seatIds: z.array(z.string()).min(1, '请至少选择一个座位'),
});

export const financeSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, '请选择分类'),
  amount: z.number().min(0.01, '金额必须大于0'),
  description: z.string().optional(),
  relatedOrderId: z.string().optional(),
  receiptUrl: z.string().url('请输入有效的收据地址').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductionInput = z.infer<typeof productionSchema>;
export type CharacterInput = z.infer<typeof characterSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type RehearsalInput = z.infer<typeof rehearsalSchema>;
export type LeaveInput = z.infer<typeof leaveSchema>;
export type ShowInput = z.infer<typeof showSchema>;
export type TicketTierInput = z.infer<typeof ticketTierSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type FinanceInput = z.infer<typeof financeSchema>;
