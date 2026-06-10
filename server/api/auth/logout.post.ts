import { successResponse } from '~/server/utils/response'

export default defineEventHandler((event) => {
  return successResponse(null, '退出成功')
})
