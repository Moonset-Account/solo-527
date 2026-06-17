import { BaseService } from './base-service'
import type { Question } from '@/types/database'
import { mockQuestions } from '@/lib/mock-data'

class QuestionService extends BaseService<Question> {
  constructor() {
    super({ tableName: 'questions', useMock: true })
    this.setMockData(mockQuestions)
  }

  async getByCategory(category: string): Promise<Question[]> {
    const all = await this.getAll()
    return all.filter((q) => q.category === category)
  }

  async getByDifficulty(difficulty: string): Promise<Question[]> {
    const all = await this.getAll()
    return all.filter((q) => q.difficulty === difficulty)
  }

  async search(keyword: string): Promise<Question[]> {
    const all = await this.getAll()
    const lower = keyword.toLowerCase()
    return all.filter((q) => q.content.toLowerCase().includes(lower))
  }

  async getActive(): Promise<Question[]> {
    const all = await this.getAll()
    return all.filter((q) => q.is_active)
  }
}

export const questionService = new QuestionService()
