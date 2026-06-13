export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { enqueueBatchTask } = await import('~/server/utils/queue')
  const { mockGenerateSuggestion } = await import('~/server/utils/mock')
  const body = await readBody(event)
  const { name, totalItems, timeoutMinutes, config, questions } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '请填写任务名称' })
  }

  const db = useDB()
  const now = new Date()
  const task = await db.batchTask.create({
    data: {
      name,
      status: 'scheduled',
      totalItems: totalItems || (questions?.length || 0),
      timeoutMinutes: timeoutMinutes || 30,
      config: config || {},
      createdBy: user.id,
      scheduledAt: now,
    },
  })

  if (questions && questions.length > 0) {
    await db.question.createMany({
      data: questions.map((q: any) => ({
        content: q.content,
        templateVars: q.templateVars || null,
        batchTaskId: task.id,
        createdBy: user.id,
      })),
    })
  }

  await db.todoItem.create({
    data: {
      userId: user.id,
      batchTaskId: task.id,
      type: 'review',
      status: 'pending',
      dueAt: new Date(now.getTime() + task.timeoutMinutes * 60 * 1000),
    },
  })

  try {
    await enqueueBatchTask(task.id)
  } catch (e) {
    console.error('[tasks] enqueue failed, fallback to local:', e)
    setTimeout(async () => {
      try {
        const db2 = useDB()
        const localTask = await db2.batchTask.findUnique({
          where: { id: task.id },
          include: { questions: true },
        })
        if (!localTask) return
        if (localTask.status !== 'pending' && localTask.status !== 'scheduled') return
        await db2.batchTask.update({ where: { id: task.id }, data: { status: 'generating', startedAt: new Date() } })
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
                batchTaskId: task.id,
                questionId: q.id,
                endpoint: '/api/suggestions/generate',
                requestBody: { content: q.content } as any,
                responseStatus: 200,
                responseBody: { suggestionId: sug.id } as any,
                durationMs,
              },
            })
            completedCount++
            await db2.batchTask.update({ where: { id: task.id }, data: { completedItems: completedCount } })
          } catch {
            completedCount++
          }
        }
        await db2.batchTask.update({
          where: { id: task.id },
          data: { status: 'completed', completedItems: localTask.questions.length, completedAt: new Date() },
        })
        await db2.todoItem.updateMany({ where: { batchTaskId: task.id, status: 'pending' }, data: { status: 'done' } })
      } catch (err) {
        console.error('[tasks] fallback processor failed:', err)
      }
    }, 1500)
  }

  return task
})
