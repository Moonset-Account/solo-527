import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  const todoId = Number(getRouterParam(event, 'todoId'))
  if (!todoId) throw fail('缺少待办ID', 400)
  const body = await readBody(event)
  const todo = await prisma.todo.findUnique({ where: { id: todoId }, include: { issue: true } })
  if (!todo) throw fail('待办不存在', 404, 404)
  event.context.issueCode = todo.issue?.code
  const updated = await prisma.todo.update({
    where: { id: todoId },
    data: { done: true, doneAt: new Date(), assignee: body.assignee || todo.assignee }
  })
  await recordOperationLog({
    operator: body.operator || todo.assignee || 'system',
    action: '完成待办',
    detail: todo.title,
    issueId: todo.issueId
  })
  return ok(updated, '待办已完成')
})
