import KnowledgeItem from '#models/knowledge_item'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export interface VectorSearchResult {
  id: number
  title: string
  content: string
  category: string | null
  tags: string[]
  similarityScore: number
}

export interface VectorSearchAdapter {
  searchByText(query: string, topK?: number, category?: string): Promise<VectorSearchResult[]>
}

export class MockVectorSearchAdapter implements VectorSearchAdapter {
  private static instance: MockVectorSearchAdapter

  static getInstance(): MockVectorSearchAdapter {
    if (!MockVectorSearchAdapter.instance) {
      MockVectorSearchAdapter.instance = new MockVectorSearchAdapter()
    }
    return MockVectorSearchAdapter.instance
  }

  private calculateSimilarity(text: string, query: string): number {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const queryTerms = lowerQuery.split(/\s+/).filter((t) => t.length > 0)

    if (queryTerms.length === 0) return 0.5

    let hitCount = 0
    let totalWeight = 0

    for (const term of queryTerms) {
      const regex = new RegExp(this.escapeRegex(term), 'gi')
      const matches = lowerText.match(regex)
      const count = matches ? matches.length : 0
      const weight = term.length / lowerQuery.length
      hitCount += count * weight
      totalWeight += weight
    }

    const normalizedScore = totalWeight > 0 ? hitCount / (queryTerms.length * 2) : 0
    const randomBoost = 0.3 + Math.random() * 0.4
    const finalScore = Math.min(0.99, Math.max(0.1, normalizedScore * 0.6 + randomBoost * 0.4))

    return Number(finalScore.toFixed(4))
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  async searchByText(query: string, topK = 5, category?: string): Promise<VectorSearchResult[]> {
    const queryLower = query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 0)

    let queryBuilder: ModelQueryBuilderContract<typeof KnowledgeItem, KnowledgeItem> =
      KnowledgeItem.query().where('isActive', true).whereNull('deletedAt')

    if (category) {
      queryBuilder = queryBuilder.where('category', category)
    }

    if (queryTerms.length > 0) {
      queryBuilder = queryBuilder.where((builder) => {
        for (const term of queryTerms) {
          builder.orWhere('title', 'ILIKE', `%${term}%`).orWhere('content', 'ILIKE', `%${term}%`)
        }
      })
    }

    const items = await queryBuilder.limit(Math.min(topK * 3, 50)).orderByRaw('RANDOM()').exec()

    const results: VectorSearchResult[] = items.map((item) => {
      const combinedText = `${item.title} ${item.content} ${(item.tags || []).join(' ')}`
      const score = this.calculateSimilarity(combinedText, query)
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags || [],
        similarityScore: score,
      }
    })

    results.sort((a, b) => b.similarityScore - a.similarityScore)

    return results.slice(0, topK)
  }
}

export const vectorSearchAdapter: VectorSearchAdapter = MockVectorSearchAdapter.getInstance()

export default vectorSearchAdapter
