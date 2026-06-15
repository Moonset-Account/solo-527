import { getFluctuations } from '~/server/utils/mockData'
import type { Fluctuation } from '~/types'
import dayjs from 'dayjs'

const fluctuationsStore: Fluctuation[] = getFluctuations()

interface ApiErrorPayload {
  endpoint: string
  method: string
  statusCode: number
  errorMessage: string
  requestBody?: Record<string, any>
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as ApiErrorPayload

  if (!body.endpoint || !body.statusCode || !body.errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少必要字段: endpoint, statusCode, errorMessage'
    })
  }

  const now = dayjs()
  const fluctuation: Fluctuation = {
    id: 'fluc_api_' + Date.now(),
    title: `接口异常: ${body.endpoint} ${body.method} ${body.statusCode}`,
    description: `接口 ${body.endpoint} 调用失败，状态码 ${body.statusCode}，错误信息: ${body.errorMessage}`,
    readableReason: buildReadableReason(body),
    metric: '',
    currentValue: undefined,
    expectedValue: undefined,
    deviation: undefined,
    priority: body.statusCode >= 500 ? 'high' : 'medium',
    status: 'pending',
    assigneeId: 'user_supply',
    assigneeName: '赵供应',
    deadline: now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    source: 'api_error',
    detectedAt: now.format('YYYY-MM-DD HH:mm:ss')
  }

  fluctuationsStore.unshift(fluctuation)

  console.log(
    `[告警] 接口错误已创建异常记录并分配给供应链经理(赵供应)`,
    `| 接口: ${body.endpoint}`,
    `| 状态码: ${body.statusCode}`,
    `| 异常ID: ${fluctuation.id}`,
    `| 截止时间: ${fluctuation.deadline}`
  )

  return {
    success: true,
    message: '接口错误已记录为异常波动，已分配给供应链经理',
    data: {
      fluctuationId: fluctuation.id,
      title: fluctuation.title,
      readableReason: fluctuation.readableReason,
      assigneeId: fluctuation.assigneeId,
      assigneeName: fluctuation.assigneeName,
      deadline: fluctuation.deadline,
      priority: fluctuation.priority
    }
  }
})

function buildReadableReason(error: ApiErrorPayload): string {
  const reasons: Record<number, string> = {
    400: '请求参数错误，需检查接口调用方式',
    401: '认证失效，需重新获取访问令牌',
    403: '权限不足，需检查接口访问权限配置',
    404: '接口地址不存在或已下线',
    408: '请求超时，服务端响应过慢或网络不稳定',
    429: '请求频率过高，触发限流机制',
    500: '服务端内部错误，需联系运维排查',
    502: '网关错误，上游服务不可用',
    503: '服务暂时不可用，可能正在维护或过载',
    504: '网关超时，上游服务响应超时'
  }

  const reason = reasons[error.statusCode]
  if (reason) {
    return `${error.endpoint} 返回 ${error.statusCode}: ${reason}。已分配供应链经理跟进处理，截止明日。`
  }

  if (error.statusCode >= 500) {
    return `${error.endpoint} 服务端异常(${error.statusCode}): ${error.errorMessage}。已分配供应链经理跟进处理，截止明日。`
  }

  if (error.statusCode >= 400) {
    return `${error.endpoint} 客户端错误(${error.statusCode}): ${error.errorMessage}。需核实接口调用方式，已分配供应链经理跟进。`
  }

  return `${error.endpoint} 异常(${error.statusCode}): ${error.errorMessage}。已分配供应链经理跟进处理，截止明日。`
}
