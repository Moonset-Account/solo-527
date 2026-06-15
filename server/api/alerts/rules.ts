import { getAlertRules } from '~/server/utils/mockData'
import type { AlertRule } from '~/types'

let rules: AlertRule[] = getAlertRules()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return rules
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const newRule: AlertRule = {
      id: 'ar_' + Date.now(),
      ...body,
      enabled: true,
      createdAt: new Date().toISOString()
    }
    rules.unshift(newRule)
    return newRule
  }
})
