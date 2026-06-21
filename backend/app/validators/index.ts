import vine from '@vinejs/vine'

export const loginSchema = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(3).maxLength(50),
    password: vine.string().minLength(6).maxLength(100),
  })
)

export const generateEmailSchema = vine.compile(
  vine.object({
    customerBackground: vine.object({
      companyName: vine.string().trim().optional(),
      industry: vine.string().trim().optional(),
      contactPerson: vine.string().trim().optional(),
      painPoints: vine.string().trim().optional(),
      budget: vine.string().trim().optional(),
      timeline: vine.string().trim().optional(),
      additionalInfo: vine.string().trim().optional(),
    }),
    templateId: vine.number().positive().optional(),
    recipientEmail: vine.string().email().optional(),
    recipientName: vine.string().trim().optional(),
  })
)

export const emailListSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    status: vine
      .enum(['draft', 'reviewing', 'approved', 'rejected', 'sent', 'archived'] as const)
      .optional(),
    keyword: vine.string().trim().optional(),
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)

export const submitReviewSchema = vine.compile(
  vine.object({
    note: vine.string().trim().optional(),
  })
)

export const updateEmailSchema = vine.compile(
  vine.object({
    subject: vine.string().trim().minLength(1).maxLength(200).optional(),
    body: vine.string().trim().minLength(1).optional(),
    recipientEmail: vine.string().email().optional(),
    recipientName: vine.string().trim().optional(),
  })
)

export const knowledgeIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    keyword: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    tag: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const knowledgeStoreSchema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(200),
    content: vine.string().trim().minLength(10),
    category: vine.string().trim().optional(),
    tags: vine.array(vine.string().trim()).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const knowledgeUpdateSchema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(200).optional(),
    content: vine.string().trim().minLength(10).optional(),
    category: vine.string().trim().nullable().optional(),
    tags: vine.array(vine.string().trim()).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const knowledgeSearchSchema = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1),
    topK: vine.number().positive().max(20).optional(),
    category: vine.string().trim().optional(),
  })
)

export const templateIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    keyword: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
  })
)

export const templateStoreSchema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    version: vine.string().trim().minLength(1).maxLength(20),
    content: vine.string().trim().minLength(10),
    variables: vine.string().trim().optional(),
  })
)

export const templateUpdateSchema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    description: vine.string().trim().nullable().optional(),
    category: vine.string().trim().nullable().optional(),
  })
)

export const templateCreateVersionSchema = vine.compile(
  vine.object({
    version: vine.string().trim().minLength(1).maxLength(20),
    content: vine.string().trim().minLength(10),
    variables: vine.string().trim().optional(),
  })
)

export const promptIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    keyword: vine.string().trim().optional(),
    promptType: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const promptStoreSchema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    promptType: vine.string().trim().minLength(2).maxLength(50),
    version: vine.string().trim().minLength(1).maxLength(20),
    systemPrompt: vine.string().trim().minLength(10),
    userPromptTemplate: vine.string().trim().optional(),
    parameters: vine.record(vine.any()).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const promptUpdateSchema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    promptType: vine.string().trim().minLength(2).maxLength(50).optional(),
    systemPrompt: vine.string().trim().minLength(10).optional(),
    userPromptTemplate: vine.string().trim().nullable().optional(),
    parameters: vine.record(vine.any()).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const reviewIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    status: vine.enum(['reviewing', 'approved', 'rejected'] as const).optional(),
    salesId: vine.number().positive().optional(),
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)

export const reviewRejectSchema = vine.compile(
  vine.object({
    reasonCode: vine.string().trim().minLength(1),
    note: vine.string().trim().minLength(5),
  })
)

export const riskIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    riskLevel: vine.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
    category: vine.string().trim().optional(),
    keyword: vine.string().trim().optional(),
  })
)

export const riskMarkNegativeSchema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(200),
    content: vine.string().trim().minLength(10),
    riskLevel: vine.enum(['low', 'medium', 'high', 'critical'] as const),
    riskDescription: vine.string().trim().minLength(5),
    category: vine.string().trim().optional(),
    correctHandling: vine.string().trim().optional(),
    tags: vine.array(vine.string().trim()).optional(),
  })
)

export const analyticsSummarySchema = vine.compile(
  vine.object({
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)

export const analyticsCostBreakdownSchema = vine.compile(
  vine.object({
    dimension: vine.enum(['date', 'user', 'reviewer', 'reason'] as const),
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)

export const analyticsHitRateSchema = vine.compile(
  vine.object({
    days: vine.number().positive().max(365).optional(),
  })
)

export const analyticsRejectReasonsSchema = vine.compile(
  vine.object({
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)

export const logIndexSchema = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    userId: vine.number().positive().optional(),
    action: vine.string().trim().optional(),
    resourceType: vine.string().trim().optional(),
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
  })
)
