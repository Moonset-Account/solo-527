import { BaseService } from './base-service'
import type { HiringResult } from '@/types/database'
import { mockHiringResults } from '@/lib/mock-data'

class HiringResultService extends BaseService<HiringResult> {
  constructor() {
    super({ tableName: 'hiring_results', useMock: true })
    this.setMockData(mockHiringResults)
  }

  async getByDecision(decision: string): Promise<HiringResult[]> {
    const all = await this.getAll()
    return all.filter((r) => r.decision === decision)
  }

  async getByDepartment(department: string): Promise<HiringResult[]> {
    const all = await this.getAll()
    return all.filter((r) => r.department === department)
  }

  async getByDateRange(startDate: string, endDate: string): Promise<HiringResult[]> {
    const all = await this.getAll()
    return all.filter((r) => {
      const decisionDate = r.decision_date
      return decisionDate >= startDate && decisionDate <= endDate
    })
  }
}

export const hiringResultService = new HiringResultService()
