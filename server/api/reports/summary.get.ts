import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  const [
    totalCandidates,
    byStage,
    byDepartment,
    avgQualityScore,
    noShowCount,
    interviewsThisMonth,
    qualityByInterviewer,
    stageConversion,
    qualityScoreDistribution
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.groupBy({
      by: ['currentStage'],
      _count: true,
      orderBy: { currentStage: 'asc' }
    }),
    prisma.candidate.groupBy({
      by: ['department'],
      _count: true
    }),
    prisma.interview.aggregate({
      _avg: { qualityScore: true },
      _count: true,
      where: { qualityScore: { not: null } }
    }),
    prisma.interview.count({ where: { status: 'NO_SHOW' } }),
    prisma.interview.count({
      where: {
        scheduledAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.interview.findMany({
      where: { qualityScore: { not: null } },
      include: { interviewer: { select: { id: true, name: true, department: true } } },
      take: 100
    }),
    prisma.stageHistory.groupBy({
      by: ['fromStage', 'toStage'],
      _count: true
    }),
    prisma.interview.groupBy({
      by: ['qualityScore'],
      _count: true,
      where: { qualityScore: { not: null } }
    })
  ])

  const scoreDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  qualityScoreDistribution.forEach((item: any) => {
    if (item.qualityScore !== null) {
      scoreDistribution[item.qualityScore] = item._count
    }
  })

  const interviewerQualityMap = new Map<number, { scores: number[], count: number }>()
  qualityByInterviewer.forEach((i: any) => {
    const key = i.interviewerId
    if (!interviewerQualityMap.has(key)) {
      interviewerQualityMap.set(key, { scores: [], count: 0 })
    }
    interviewerQualityMap.get(key)!.scores.push(i.qualityScore!)
    interviewerQualityMap.get(key)!.count++
  })

  const interviewerQuality = Array.from(interviewerQualityMap.entries()).map(([id, data]) => {
    const interview = qualityByInterviewer.find((i: any) => i.interviewerId === id)!
    return {
      interviewerId: id,
      interviewerName: interview.interviewer.name,
      department: interview.interviewer.department,
      interviewCount: data.count,
      avgQuality: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    }
  }).sort((a: any, b: any) => b.interviewCount - a.interviewCount)

  return {
    overview: {
      totalCandidates,
      interviewsThisMonth,
      avgQualityScore: avgQualityScore._avg.qualityScore?.toFixed(2) || null,
      noShowCount,
      completedQualityInterviews: avgQualityScore._count
    },
    byStage: byStage.map((g: any) => ({ stage: g.currentStage, count: g._count })),
    byDepartment: byDepartment.map((g: any) => ({ department: g.department, count: g._count })),
    interviewerQuality,
    stageConversion: stageConversion.map((g: any) => ({
      from: g.fromStage,
      to: g.toStage,
      count: g._count
    })),
    scoreDistribution
  }
})
