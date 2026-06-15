import { getAlertOverview } from '~/server/utils/mockData'

export default defineEventHandler(() => {
  return getAlertOverview()
})
