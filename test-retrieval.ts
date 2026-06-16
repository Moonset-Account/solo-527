import prisma from './src/lib/prisma';
import { cacheDeletePattern } from './src/lib/redis';

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, '').replace(/[，。！？、；：""''（）【】]/g, '')
}

const getNGrams = (text: string, n = 2): string[] => {
  const normalized = normalizeText(text)
  const grams: string[] = []
  for (let i = 0; i <= normalized.length - n; i++) {
    grams.push(normalized.slice(i, i + n))
  }
  return grams
}

const extractKeywords = (text: string): string[] => {
  const normalized = normalizeText(text)
  const keywords: string[] = []
  const stopWords = new Set(['我', '想', '要', '怎', '么', '怎', '办', '操', '作', '是', '的', '了', '吗', '啊', '呢', '吧', '请', '问', '能', '可', '以', '该', '如', '何'])
  
  for (let i = 0; i < normalized.length; i++) {
    if (!stopWords.has(normalized[i])) {
      keywords.push(normalized[i])
    }
    if (i < normalized.length - 1) {
      const bigram = normalized.slice(i, i + 2)
      if (!stopWords.has(bigram[0]) || !stopWords.has(bigram[1])) {
        keywords.push(bigram)
      }
    }
  }
  
  return [...new Set(keywords)]
}

const calculateSimilarity = (query: string, text: string): number => {
  const queryKeywords = extractKeywords(query)
  const normalizedText = normalizeText(text)
  
  if (queryKeywords.length === 0) return 0
  
  let matchScore = 0
  let matchedKeywords = 0
  
  for (const keyword of queryKeywords) {
    if (normalizedText.includes(keyword)) {
      matchedKeywords++
      const weight = keyword.length === 2 ? 2 : 1
      matchScore += weight
    }
  }
  
  const keywordMatch = matchedKeywords / queryKeywords.length
  const bigramMatch = calculateBigramSimilarity(query, text)
  
  const containsBoost = normalizedText.includes(normalizeText(query)) ? 0.3 : 0
  
  return Math.min(keywordMatch * 0.6 + bigramMatch * 0.4 + containsBoost, 1.0)
}

const calculateBigramSimilarity = (text1: string, text2: string): number => {
  const grams1 = new Set(getNGrams(text1, 2))
  const grams2 = new Set(getNGrams(text2, 2))
  
  if (grams1.size === 0 || grams2.size === 0) return 0
  
  let intersection = 0
  for (const gram of grams1) {
    if (grams2.has(gram)) intersection++
  }
  
  const union = grams1.size + grams2.size - intersection
  return union > 0 ? intersection / union : 0
}

const query = '我想退货，怎么操作？';
console.log('查询:', query);
console.log('规范化后:', normalizeText(query));
console.log('关键词:', extractKeywords(query));

(async () => {
  await cacheDeletePattern('search:*');
  await new Promise(r => setTimeout(r, 300));

  const knowledge = await prisma.knowledgeBase.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, title: true, content: true, tags: true, category: true }
  });
  console.log('\n知识库条目数量:', knowledge.length);
  
  const results: { knowledge: typeof knowledge[0], score: number }[] = [];
  
  for (const k of knowledge) {
    const titleScore = calculateSimilarity(query, k.title) * 1.5;
    const contentScore = calculateSimilarity(query, k.content);
    const tagsScore = k.tags.reduce((acc, tag) => {
      return acc + calculateSimilarity(query, tag) * 0.5;
    }, 0) / Math.max(k.tags.length, 1);
    const categoryScore = calculateSimilarity(query, k.category) * 0.3;
    const totalScore = titleScore + contentScore + tagsScore + categoryScore;
    
    if (totalScore > 0.05) {
      results.push({ knowledge: k, score: totalScore });
    }
    
    if (k.title.includes('退换货') || k.title.includes('退货')) {
      console.log('\n=== 退换货相关匹配详情 ===');
      console.log('标题:', k.title);
      console.log('规范化标题:', normalizeText(k.title));
      console.log('标题关键词:', extractKeywords(k.title));
      console.log('标题得分:', titleScore.toFixed(3));
      console.log('内容得分:', contentScore.toFixed(3));
      console.log('标签得分:', tagsScore.toFixed(3));
      console.log('分类得分:', categoryScore.toFixed(3));
      console.log('总得分:', totalScore.toFixed(3));
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  console.log('\n=== 最终匹配结果 ===');
  results.slice(0, 5).forEach((r, i) => {
    console.log(`${i+1}. ${r.knowledge.title} (得分: ${r.score.toFixed(3)}, 命中: ${r.score > 0.15})`);
  });
})();
