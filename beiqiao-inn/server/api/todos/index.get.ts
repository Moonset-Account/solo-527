import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const where: any = {}

  if (query.status) {
    where.status = query.status
  }

  if (query.priority) {
    where.priority = query.priority
  }

  if (query.type) {
    where.type = query.type
  }

  if (query.assigneeId) {
    where.assigneeId = Number(query.assigneeId)
  }

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    let filtered = [...store.todos]
    if (where.status) filtered = filtered.filter(t => t.status === where.status)
    if (where.priority) filtered = filtered.filter(t => t.priority === where.priority)
    if (where.type) filtered = filtered.filter(t => t.type === where.type)
    if (where.assigneeId) filtered = filtered.filter(t => t.assigneeId === where.assigneeId)
    return filtered
  }

  const todos = await prisma.todoItem.findMany({
    where,
    include: { assignee: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })

  return todos
})
