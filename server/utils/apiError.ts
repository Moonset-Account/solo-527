interface ApiErrorOptions {
  statusCode?: number
  statusMessage?: string
  data?: Record<string, unknown>
  contactPerson?: string
  recordReference?: string
}

export function createApiError(options: ApiErrorOptions) {
  const { statusCode = 500, statusMessage = '服务异常', data, contactPerson, recordReference } = options

  const errorData: Record<string, unknown> = {
    success: false,
    message: statusMessage,
    ...data,
  }

  if (contactPerson) {
    errorData.contactPerson = contactPerson
  }

  if (recordReference) {
    errorData.recordReference = recordReference
  }

  throw createError({
    statusCode,
    statusMessage,
    data: errorData,
  })
}

export function handlePrismaError(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : '未知数据库错误'
  createApiError({
    statusCode: 500,
    statusMessage: `${context}失败：${message}`,
    contactPerson: '系统管理员',
    recordReference: context,
  })
}
