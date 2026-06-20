import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import type { Knowledge } from '@prisma/client';

export async function getKnowledgeById(id: string) {
  const cacheKey = `knowledge:hot:${id}`;
  const cached = await cacheGet<Knowledge>(cacheKey);
  if (cached) {
    await prisma.knowledge.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return cached;
  }

  const knowledge = await prisma.knowledge.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      satisfactions: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });

  if (knowledge) {
    await prisma.knowledge.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    await cacheSet(cacheKey, knowledge, 3600);
  }

  return knowledge;
}

export async function createKnowledge(data: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: 'ANSWER' | 'TUTORIAL';
  createdBy: string;
}) {
  const knowledge = await prisma.knowledge.create({ data });
  await cacheDel('knowledge:hot:*');
  return knowledge;
}

export async function updateKnowledge(
  id: string,
  data: Partial<Pick<Knowledge, 'title' | 'content' | 'category' | 'tags' | 'status'>>
) {
  const knowledge = await prisma.knowledge.update({
    where: { id },
    data: { ...data, version: { increment: 1 } },
  });
  await cacheDel(`knowledge:hot:${id}`);
  await cacheDel('knowledge:hot:*');
  return knowledge;
}

export async function markUseful(id: string) {
  await prisma.knowledge.update({
    where: { id },
    data: { usefulCount: { increment: 1 } },
  });
  await cacheDel(`knowledge:hot:${id}`);
}

export async function markInvalid(
  id: string,
  invalidNote: string,
  invalidResult: string
) {
  const knowledge = await prisma.knowledge.update({
    where: { id },
    data: {
      status: 'INVALID',
      invalidNote,
      invalidResult,
      version: { increment: 1 },
    },
  });
  await cacheDel(`knowledge:hot:${id}`);
  await cacheDel('knowledge:hot:*');
  return knowledge;
}

export async function getRelatedKnowledge(id: string, limit = 5) {
  const current = await prisma.knowledge.findUnique({ where: { id } });
  if (!current) return [];

  const related = await prisma.knowledge.findMany({
    where: {
      id: { not: id },
      status: 'ACTIVE',
      OR: [
        { category: current.category },
        { tags: { hasSome: current.tags.slice(0, 2) } },
      ],
    },
    take: limit,
    orderBy: [{ viewCount: 'desc' }, { usefulCount: 'desc' }],
    select: { id: true, title: true, category: true, viewCount: true },
  });

  return related;
}

export async function getKnowledgeSatisfactionStats(knowledgeId: string) {
  const stats = await prisma.satisfaction.aggregate({
    where: { knowledgeId },
    _avg: { score: true },
    _count: { score: true },
  });

  const distribution = await prisma.satisfaction.groupBy({
    by: ['score'],
    where: { knowledgeId },
    _count: { score: true },
    orderBy: { score: 'asc' },
  });

  const keywords = await prisma.satisfaction.findMany({
    where: { knowledgeId },
    select: { keywords: true },
    take: 100,
  });

  const keywordMap = new Map<string, number>();
  keywords.forEach(k => {
    k.keywords.forEach(kw => {
      keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
    });
  });

  const topKeywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return {
    avgScore: stats._avg.score || 0,
    totalCount: stats._count.score,
    distribution: distribution.map(d => ({ score: d.score, count: d._count.score })),
    topKeywords,
  };
}
