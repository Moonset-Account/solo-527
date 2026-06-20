import { prisma } from '@/lib/prisma';
import type { SatisfactionInput } from '@/lib/validation';

export async function createSatisfaction(data: SatisfactionInput) {
  return prisma.satisfaction.create({ data });
}

export async function getSatisfactionByTicketId(ticketId: string) {
  return prisma.satisfaction.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSatisfactionStats(params?: {
  startDate?: Date;
  endDate?: Date;
  knowledgeId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params?.startDate) where.createdAt = { gte: params.startDate };
  if (params?.endDate) where.createdAt = { ...(where.createdAt as object), lte: params.endDate };
  if (params?.knowledgeId) where.knowledgeId = params.knowledgeId;

  const [stats, distribution, recent] = await Promise.all([
    prisma.satisfaction.aggregate({
      where,
      _avg: { score: true },
      _count: { score: true },
    }),
    prisma.satisfaction.groupBy({
      by: ['score'],
      where,
      _count: { score: true },
      orderBy: { score: 'asc' },
    }),
    prisma.satisfaction.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        knowledge: { select: { id: true, title: true } },
      },
    }),
  ]);

  const allKeywords = await prisma.satisfaction.findMany({
    where,
    select: { keywords: true },
    take: 500,
  });

  const keywordMap = new Map<string, number>();
  allKeywords.forEach(k => {
    k.keywords.forEach(kw => {
      keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
    });
  });

  const topKeywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  const trendData = await getDailyTrend(params);

  return {
    avgScore: stats._avg.score || 0,
    totalCount: stats._count.score,
    distribution: distribution.map(d => ({ score: d.score, count: d._count.score })),
    recent,
    topKeywords,
    trendData,
  };
}

async function getDailyTrend(params?: { startDate?: Date; endDate?: Date }) {
  const start = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = params?.endDate || new Date();

  const result = await prisma.$queryRaw<{ date: string; avg_score: number; count: number }[]>`
    SELECT 
      DATE(s.created_at) as date,
      AVG(s.score) as avg_score,
      COUNT(*) as count
    FROM "Satisfaction" s
    WHERE s.created_at BETWEEN ${start} AND ${end}
    GROUP BY DATE(s.created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  return result.map(r => ({
    date: r.date,
    avgScore: Number(r.avg_score),
    count: r.count,
  })).reverse();
}

export async function getLowScoreKnowledge(limit = 10) {
  const result = await prisma.$queryRaw<{ knowledge_id: string; title: string; avg_score: number; count: number }[]>`
    SELECT 
      k.id as knowledge_id,
      k.title,
      AVG(s.score) as avg_score,
      COUNT(*) as count
    FROM "Satisfaction" s
    JOIN "Knowledge" k ON s.knowledge_id = k.id
    WHERE s.score <= 3
    GROUP BY k.id, k.title
    HAVING COUNT(*) >= 3
    ORDER BY avg_score ASC
    LIMIT ${limit}
  `;

  return result.map(r => ({
    id: r.knowledge_id,
    title: r.title,
    avgScore: Number(r.avg_score),
    count: r.count,
  }));
}
