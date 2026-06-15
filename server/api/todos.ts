import { getTodoGroups } from '~/server/utils/mockData'
import type { TodoGroup } from '~/types'

let todoGroups: TodoGroup[] = getTodoGroups()

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const assigneeId = query.assigneeId as string

  if (assigneeId) {
    const group = todoGroups.find(g => g.assigneeId === assigneeId)
    return group || { assigneeId, assigneeName: '', count: 0, items: [] }
  }

  return todoGroups
})
