export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({
    where: { id },
    include: { questions: true },
  })

  if (!task || task.status === 'generating' || task.status === 'completed') {
    return task
  }

  await db.batchTask.update({
    where: { id },
    data: { status: 'generating', startedAt: new Date() },
  })

  let completedCount = 0
  for (const question of task.questions) {
    try {
      const startTime = Date.now()
      const mockResult = await mockGenerateSuggestion(question.content)
      const durationMs = Date.now() - startTime

      const suggestion = await db.replySuggestion.create({
        data: {
          questionId: question.id,
          content: mockResult.content,
          confidence: mockResult.confidence,
          isHit: mockResult.isHit,
        },
      })

      if (mockResult.references.length > 0) {
        await db.referenceSource.createMany({
          data: mockResult.references.map((r: any) => ({
            replySuggestionId: suggestion.id,
            docTitle: r.docTitle,
            docUrl: r.docUrl,
            relevanceScore: r.relevanceScore,
            isMissing: r.isMissing,
            missingReason: r.missingReason,
          })),
        })
      }

      await db.callLog.create({
        data: {
          batchTaskId: task.id,
          questionId: question.id,
          endpoint: '/api/suggestions/generate',
          requestBody: { content: question.content } as any,
          responseStatus: 200,
          responseBody: { suggestionId: suggestion.id } as any,
          durationMs,
        },
      })

      completedCount++
      await db.batchTask.update({
        where: { id },
        data: { completedItems: completedCount },
      })
    } catch {
      completedCount++
    }
  }

  await db.batchTask.update({
    where: { id },
    data: {
      status: 'completed',
      completedItems: task.questions.length,
      completedAt: new Date(),
    },
  })

  await db.todoItem.updateMany({
    where: { batchTaskId: id, status: 'pending' },
    data: { status: 'done' },
  })

  return await db.batchTask.findUnique({ where: { id } })
})
