import { BaseService } from './base-service'
import type { Interview } from '@/types/database'
import { mockInterviews } from '@/lib/mock-data'

class InterviewService extends BaseService<Interview> {
  constructor() {
    super({ tableName: 'interviews', useMock: true })
    this.setMockData(mockInterviews)
  }

  async getByInterviewer(interviewerId: string): Promise<Interview[]> {
    const all = await this.getAll()
    return all.filter((i) => i.interviewer_id === interviewerId)
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Interview[]> {
    const all = await this.getAll()
    return all.filter((i) => {
      const startTime = i.start_time
      return startTime >= startDate && startTime <= endDate
    })
  }

  async getByStatus(status: string): Promise<Interview[]> {
    const all = await this.getAll()
    return all.filter((i) => i.status === status)
  }

  async checkConflict(interviewerId: string, startTime: string, endTime: string, excludeId?: string): Promise<Interview[]> {
    const all = await this.getByInterviewer(interviewerId)
    return all.filter((i) => {
      if (excludeId && i.id === excludeId) return false
      return !(i.end_time <= startTime || i.start_time >= endTime)
    })
  }
}

export const interviewService = new InterviewService()
