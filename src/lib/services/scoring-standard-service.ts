import { BaseService } from './base-service'
import type { ScoringStandard } from '@/types/database'
import { mockScoringStandards } from '@/lib/mock-data'

class ScoringStandardService extends BaseService<ScoringStandard> {
  constructor() {
    super({ tableName: 'scoring_standards', useMock: true })
    this.setMockData(mockScoringStandards)
  }

  async getActive(): Promise<ScoringStandard[]> {
    const all = await this.getAll()
    return all.filter((s) => s.is_active)
  }

  async getByPosition(position: string): Promise<ScoringStandard[]> {
    const all = await this.getAll()
    return all.filter((s) => s.position === position)
  }
}

export const scoringStandardService = new ScoringStandardService()
