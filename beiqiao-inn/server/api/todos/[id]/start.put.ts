import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    const todo = store.todos.find(t => t.id === id)
    if (!todo) {
      throw createError({ statusCode: 404, message: 'Todo not found' })
    }
    todo.status = 'IN_PROGRESS'
    return todo
  }

  const todo = await prisma.todoItem.findUnique({ where: { id } })
  if (!todo) {
    throw createError({ statusCode: 404, message: 'Todo not found' })
  }

  const updated = await prisma.todoItem.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
    include: { assignee: true },
  })

  await invalidateCache('api:todos:*')

  return updated
})
