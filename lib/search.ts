import { prisma } from './prisma';
import { cacheGet, cacheSet } from './redis';
import { createHash } from './utils';
import type { KnowledgeSearchParams } from './validation';

export async function searchKnowledge(params: KnowledgeSearchParams) {
  const { q, category, type, status, page = 1, pageSize = 20 } = params;
  
  const cacheKey = `knowledge:search:${createHash(JSON.stringify(params))}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const skip = (page - 1) * pageSize;
  
  let whereClause: Record<string, unknown> = {};
  
  if (category) {
    whereClause.category = category;
  }
  if (type) {
    whereClause.type = type;
  }
  if (status) {
    whereClause.status = status;
  }

  let query = prisma.knowledge;
  let orderBy: Record<string, string>[] = [{ viewCount: 'desc' }];
  let highlights: Record<string, string> = {};

  if (q && q.trim()) {
    const searchTerm = `%${q.trim()}%`;
    whereClause.OR = [
      { title: { contains: q.trim(), mode: 'insensitive' } },
      { content: { contains: q.trim(), mode: 'insensitive' } },
      { tags: { hasSome: [q.trim()] } },
    ];

    const rawResults = await prisma.$queryRaw<{ id: string; title: string; content: string; similarity: number }[]>`
      SELECT 
        k.id,
        k.title,
        k.content,
        GREATEST(
          similarity(k.title, ${q.trim()}),
          similarity(k.content, ${q.trim()})
        ) as similarity
      FROM "Knowledge" k
      WHERE 
        k.title ILIKE ${searchTerm}
        OR k.content ILIKE ${searchTerm}
        OR ${q.trim()} = ANY(k.tags)
      ORDER BY similarity DESC
      LIMIT ${pageSize} OFFSET ${skip}
    `;

    const ids = rawResults.map(r => r.id);
    
    const items = await prisma.knowledge.findMany({
      where: { id: { in: ids } },
      include: { creator: { select: { name: true } } },
    });

    const sortedItems = ids.map(id => items.find(item => item.id === id)!).filter(Boolean);

    for (const result of rawResults) {
      if (result.similarity > 0.1) {
        let highlight = result.title;
        if (result.content) {
          const contentPreview = result.content.slice(0, 200);
          const regex = new RegExp(`(${q.trim()})`, 'gi');
          highlight = contentPreview.replace(regex, '<mark>$1</mark>');
        }
        highlights[result.id] = highlight;
      }
    }

    const total = await prisma.knowledge.count({ where: whereClause });
    
    const result = {
      items: sortedItems,
      total,
      page,
      pageSize,
      highlights,
    };

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  const [items, total] = await Promise.all([
    query.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy,
      include: { creator: { select: { name: true } } },
    }),
    query.count({ where: whereClause }),
  ]);

  const result = {
    items,
    total,
    page,
    pageSize,
    highlights,
  };

  await cacheSet(cacheKey, result, 300);
  return result;
}

export async function getKnowledgeCategories() {
  const result = await prisma.knowledge.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  return result.map(r => ({ category: r.category, count: r._count.category }));
}

export async function getHotKnowledge(limit = 10) {
  const cacheKey = `knowledge:hot:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const result = await prisma.knowledge.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ viewCount: 'desc' }, { usefulCount: 'desc' }],
    take: limit,
    select: {
      id: true,
      title: true,
      category: true,
      viewCount: true,
      usefulCount: true,
    },
  });

  await cacheSet(cacheKey, result, 3600);
  return result;
}
