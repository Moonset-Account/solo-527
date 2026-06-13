export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { content, templateVars } = body

  if (!content) {
    throw createError({ statusCode: 400, message: '请输入客户问题' })
  }

  const db = useDB()
  const question = await db.question.create({
    data: {
      content,
      templateVars: templateVars || null,
      createdBy: user.id,
    },
  })

  const startTime = Date.now()
  const mockResult = await mockGenerateSuggestion(content)
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
      questionId: question.id,
      endpoint: '/api/suggestions/generate',
      requestBody: { content, templateVars } as any,
      responseStatus: 200,
      responseBody: { suggestionId: suggestion.id, confidence: mockResult.confidence } as any,
      durationMs,
    },
  })

  const fullSuggestion = await db.replySuggestion.findUnique({
    where: { id: suggestion.id },
    include: { references: true, question: true },
  })

  return fullSuggestion
})
