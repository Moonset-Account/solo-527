import { getMonthlyReport } from '~/server/utils/mockData'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const month = query.month as string || new Date().toISOString().slice(0, 7)
  return getMonthlyReport(month)
})
