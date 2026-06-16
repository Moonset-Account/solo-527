import prisma from './prisma'
import { cacheGet, cacheSet, cacheDeletePattern } from './redis'
import type { KnowledgeBase, RetrievalSourceType } from '@prisma/client'

export interface RetrievalResult {
  knowledge: KnowledgeBase
  score: number
  sourceType: RetrievalSourceType
  position: number
  isHit: boolean
}

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(normalizeText(text1).split(' '))
  const words2 = new Set(normalizeText(text2).split(' '))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  let intersection = 0
  for (const word of words1) {
    if (words2.has(word)) intersection++
  }
  
  const union = words1.size + words2.size - intersection
  return union > 0 ? intersection / union : 0
}

export const searchKnowledge = async (
  query: string,
  limit = 5
): Promise<RetrievalResult[]> => {
  const cacheKey = `search:${normalizeText(query)}`
  const cached = await cacheGet<RetrievalResult[]>(cacheKey)
  
  if (cached && cached.length > 0) {
    return cached
  }

  const activeKnowledge = await prisma.knowledgeBase.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      owner: true,
    },
  })

  const normalizedQuery = normalizeText(query)
  const results: Array<{ knowledge: KnowledgeBase; score: number; sourceType: RetrievalSourceType }> = []

  for (const knowledge of activeKnowledge) {
    const titleScore = calculateSimilarity(normalizedQuery, knowledge.title) * 1.5
    const contentScore = calculateSimilarity(normalizedQuery, knowledge.content)
    const tagsScore = knowledge.tags.reduce((acc, tag) => {
      return acc + calculateSimilarity(normalizedQuery, tag) * 0.5
    }, 0) / Math.max(knowledge.tags.length, 1)
    const categoryScore = calculateSimilarity(normalizedQuery, knowledge.category) * 0.3

    const totalScore = titleScore + contentScore + tagsScore + categoryScore

    if (totalScore > 0.1) {
      let sourceType: RetrievalSourceType = 'KNOWLEDGE_BASE'
      if (knowledge.category === '常见问题') sourceType = 'FAQ'
      else if (knowledge.category === '政策文档') sourceType = 'POLICY_DOCUMENT'
      else if (knowledge.category === '培训材料') sourceType = 'TRAINING_MATERIAL'

      results.push({
        knowledge,
        score: totalScore,
        sourceType,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)

  const finalResults: RetrievalResult[] = results.slice(0, limit).map((r, index) => ({
    ...r,
    position: index + 1,
    isHit: r.score > 0.3,
  }))

  await cacheSet(cacheKey, finalResults, 600)

  return finalResults
}

export const generateReply = async (
  question: string,
  retrievalResults: RetrievalResult[]
): Promise<{ reply: string; promptVersionId: string | null }> => {
  const activePrompt = await prisma.promptVersion.findFirst({
    where: { isActive: true },
  })

  const knowledgeContext = retrievalResults
    .map((r, i) => `${i + 1}. [${r.knowledge.title}]\n${r.knowledge.content}`)
    .join('\n\n')

  let reply: string
  
  if (retrievalResults.length === 0) {
    reply = `您好，关于"${question}"这个问题，我暂时没有找到相关的知识库内容。建议您：\n\n1. 请检查问题是否有拼写错误\n2. 尝试使用更简单的关键词重新提问\n3. 联系人工客服获取进一步帮助\n\n我们会尽快补充相关知识内容。`
  } else {
    const topResult = retrievalResults[0]
    reply = `您好，关于"${question}"这个问题，根据知识库内容，回复建议如下：\n\n${topResult.knowledge.content}\n\n---\n参考资料：\n${retrievalResults.map((r, i) => `${i + 1}. ${r.knowledge.title} (匹配度: ${(r.score * 100).toFixed(0)}%)`).join('\n')}\n\n以上内容仅供参考，请根据实际情况灵活调整。`
  }

  await cacheDeletePattern('search:*')

  return {
    reply,
    promptVersionId: activePrompt?.id || null,
  }
}

export const clearSearchCache = async (): Promise<void> => {
  await cacheDeletePattern('search:*')
}
