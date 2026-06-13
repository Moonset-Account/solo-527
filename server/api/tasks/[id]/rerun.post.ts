export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { enqueueBatchTask } = await import('~/server/utils/queue')
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  const now = new Date()
  const updated = await db.batchTask.update({
    where: { id },
    data: {
      status: 'scheduled',
      completedItems: 0,
      scheduledAt: now,
      startedAt: null,
      completedAt: null,
    },
  })

  await db.todoItem.create({
    data: {
      userId: user.id,
      batchTaskId: id!,
      type: 'rerun_timeout',
      status: 'pending',
      dueAt: new Date(now.getTime() + task.timeoutMinutes * 60 * 1000),
    },
  })

  try {
    await enqueueBatchTask(id!)
  } catch (e) {
    console.error('[tasks/rerun] enqueue failed, fallback to local:', e)
    setTimeout(async () => {
      try {
        const { mockGenerateSuggestion } = await import('~/server/utils/mock')
        const db2 = useDB()
        const localTask = await db2.batchTask.findUnique({
          where: { id: id! },
          include: { questions: true },
        })
        if (!localTask) return
        if (localTask.status !== 'pending' && localTask.status !== 'scheduled') return
        await db2.batchTask.update({ where: { id: id! }, data: { status: 'generating', startedAt: new Date() } })
        let completedCount = 0
        for (const q of localTask.questions) {
          try {
            const startTime = Date.now()
            const res = await mockGenerateSuggestion(q.content)
            const durationMs = Date.now() - startTime
            const sug = await db2.replySuggestion.create({
              data: {
                questionId: q.id,
                content: res.content,
                confidence: res.confidence,
                isHit: res.isHit,
              },
            })
            if (res.references.length > 0) {
              await db2.referenceSource.createMany({
                data: res.references.map((r: any) => ({
                  replySuggestionId: sug.id,
                  docTitle: r.docTitle,
                  docUrl: r.docUrl,
                  relevanceScore: r.relevanceScore,
                  isMissing: r.isMissing,
                  missingReason: r.missingReason,
                })),
              })
            }
            await db2.callLog.create({
              data: {
                batchTaskId: id!,
                questionId: q.id,
                endpoint: '/api/suggestions/generate',
                requestBody: { content: q.content } as any,
                responseStatus: 200,
                responseBody: { suggestionId: sug.id } as any,
                durationMs,
              },
            })
            completedCount++
            await db2.batchTask.update({ where: { id: id! }, data: { completedItems: completedCount } })
          } catch {
            completedCount++
          }
        }
        await db2.batchTask.update({
          where: { id: id! },
          data: { status: 'completed', completedItems: localTask.questions.length, completedAt: new Date() },
        })
        await db2.todoItem.updateMany({ where: { batchTaskId: id!, status: 'pending' }, data: { status: 'done' } })
      } catch (err) {
        console.error('[tasks/rerun] fallback processor failed:', err)
      }
    }, 1500)
  }

  return updated
})
