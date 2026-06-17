import { z } from 'zod'
import { LeadSource, LeadStage, DealConfidence, TodoType, ReportType, ChurnReason } from '@/generated/prisma'

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
})

export const userSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位').optional(),
  role: z.enum(['ADMIN', 'SALES_MANAGER', 'CONSULTANT']),
  phone: z.string().optional(),
})

export const customerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空'),
  phone: z.string().min(1, '联系电话不能为空'),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  propertyType: z.string().optional(),
  area: z.number().positive('面积必须大于0').optional(),
  budgetRange: z.string().optional(),
  decorationStyle: z.string().optional(),
  notes: z.string().optional(),
})

export const leadSchema = z.object({
  customerId: z.string().min(1, '客户ID不能为空'),
  source: z.enum(Object.values(LeadSource) as [string, ...string[]]),
  stage: z.enum(Object.values(LeadStage) as [string, ...string[]]).optional(),
  consultantId: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedValue: z.number().positive('预估金额必须大于0').optional(),
  dealConfidence: z.enum(Object.values(DealConfidence) as [string, ...string[]]).optional(),
  description: z.string().optional(),
})

export const surveyRecordSchema = z.object({
  leadId: z.string().min(1, '线索ID不能为空'),
  customerId: z.string().min(1, '客户ID不能为空'),
  surveyDate: z.coerce.date(),
  address: z.string().min(1, '地址不能为空'),
  area: z.number().positive('面积必须大于0'),
  houseType: z.string().min(1, '房屋类型不能为空'),
  floor: z.string().min(1, '楼层不能为空'),
  orientation: z.string().min(1, '朝向不能为空'),
  structure: z.string().min(1, '结构不能为空'),
  currentStatus: z.string().min(1, '现状不能为空'),
  decorationNeeds: z.string().min(1, '装修需求不能为空'),
  specialRequirements: z.string().optional(),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export const followUpSchema = z.object({
  leadId: z.string().min(1, '线索ID不能为空'),
  stage: z.enum(Object.values(LeadStage) as [string, ...string[]]),
  followUpDate: z.coerce.date(),
  followUpType: z.string().min(1, '跟进类型不能为空'),
  content: z.string().min(1, '跟进内容不能为空'),
  nextStep: z.string().optional(),
  nextFollowUpAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().positive('时长必须大于0').optional(),
})

export const dealPredictionSchema = z.object({
  leadId: z.string().min(1, '线索ID不能为空'),
  predictedAmount: z.number().positive('预测金额必须大于0'),
  predictedDate: z.coerce.date(),
  confidence: z.enum(Object.values(DealConfidence) as [string, ...string[]]),
  factors: z.record(z.any()).default({}),
  notes: z.string().optional(),
  isFinal: z.boolean().default(false),
})

export const exceptionRecordSchema = z.object({
  leadId: z.string().min(1, '线索ID不能为空'),
  customerId: z.string().min(1, '客户ID不能为空'),
  responsibleId: z.string().min(1, '责任人ID不能为空'),
  churnReason: z.enum(Object.values(ChurnReason) as [string, ...string[]]),
  churnReasonDetail: z.string().optional(),
  handlingStartAt: z.coerce.date(),
  handlingEndAt: z.coerce.date().optional(),
  resolution: z.string().optional(),
  isResolved: z.boolean().default(false),
  notes: z.string().optional(),
})

export const quoteVersionSchema = z.object({
  leadId: z.string().min(1, '线索ID不能为空'),
  version: z.number().int().positive('版本号必须大于0'),
  totalAmount: z.number().positive('总金额必须大于0'),
  items: z.record(z.any()).default({}),
  sentAt: z.coerce.date().optional(),
  approvedAt: z.coerce.date().optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectReason: z.string().optional(),
  notes: z.string().optional(),
})

export const todoSchema = z.object({
  type: z.enum(Object.values(TodoType) as [string, ...string[]]),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  leadId: z.string().optional(),
  assignedToId: z.string().min(1, '负责人ID不能为空'),
  dueDate: z.coerce.date().optional(),
  metadata: z.record(z.any()).default({}),
})

export const reportTaskSchema = z.object({
  type: z.enum(Object.values(ReportType) as [string, ...string[]]),
  parameters: z.record(z.any()).default({}),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const searchSchema = paginationSchema.extend({
  keyword: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.record(z.any()).optional(),
})
