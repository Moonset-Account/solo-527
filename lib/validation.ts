import { z } from 'zod';

export const slaConditionSchema = z.object({
  field: z.string().min(1, '字段不能为空'),
  operator: z.enum(['EQ', 'NE', 'GT', 'LT', 'CONTAINS']),
  value: z.string().min(1, '值不能为空'),
});

export const escalationLevelSchema = z.object({
  level: z.number().int().min(1),
  threshold: z.number().int().min(1, '阈值必须大于0'),
  notifyRoles: z.array(z.string()).min(1, '至少选择一个通知角色'),
  action: z.string().min(1, '动作描述不能为空'),
});

export const createSLARuleSchema = z.object({
  name: z.string().min(2, '规则名称至少2个字符').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, '分类不能为空'),
  conditions: z.array(slaConditionSchema).min(1, '至少配置一个条件'),
  responseTime: z.number().int().min(1, '响应时间必须大于0'),
  resolutionTime: z.number().int().min(1, '解决时间必须大于0'),
  escalationLevels: z.array(escalationLevelSchema).min(1, '至少配置一个升级级别'),
});

export const updateSLARuleSchema = createSLARuleSchema.partial().extend({
  changeReason: z.string().min(5, '变更原因至少5个字符'),
});

export const knowledgeSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['ANSWER', 'TUTORIAL']).optional(),
  status: z.enum(['ACTIVE', 'PENDING_INVALID', 'INVALID']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20),
});

export const hitScreenSchema = z.object({
  hitIds: z.array(z.string()).min(1, '至少选择一条记录'),
  status: z.enum(['VALID', 'FALSE_POSITIVE']),
});

export const exportSchema = z.object({
  type: z.enum(['HITS', 'KNOWLEDGE', 'SLA', 'TRAJECTORY']),
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  filters: z.record(z.unknown()).optional(),
});

export const trajectorySchema = z.object({
  ticketId: z.string().min(1),
  actionType: z.enum(['CREATE', 'STATUS_CHANGE', 'SLA_CHANGE', 'IMPROVEMENT', 'RESOLVE']),
  description: z.string().min(1, '描述不能为空'),
  improvementAction: z.string().optional(),
  beforeState: z.record(z.unknown()).default({}),
  afterState: z.record(z.unknown()).default({}),
  slaRuleId: z.string().optional(),
});

export const invalidKnowledgeSchema = z.object({
  knowledgeId: z.string().min(1),
  invalidNote: z.string().min(5, '失效备注至少5个字符'),
  invalidResult: z.string().min(5, '处理结果至少5个字符'),
});

export const satisfactionSchema = z.object({
  ticketId: z.string().min(1),
  knowledgeId: z.string().optional(),
  score: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  keywords: z.array(z.string()).default([]),
});

export type CreateSLARuleInput = z.infer<typeof createSLARuleSchema>;
export type UpdateSLARuleInput = z.infer<typeof updateSLARuleSchema>;
export type KnowledgeSearchParams = z.infer<typeof knowledgeSearchSchema>;
export type HitScreenInput = z.infer<typeof hitScreenSchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type TrajectoryInput = z.infer<typeof trajectorySchema>;
export type InvalidKnowledgeInput = z.infer<typeof invalidKnowledgeSchema>;
export type SatisfactionInput = z.infer<typeof satisfactionSchema>;
