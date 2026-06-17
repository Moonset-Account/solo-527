import { BaseService } from './base-service'
import type { InstructorAvailability, Interviewer } from '@/types/database'
import { mockInstructorAvailability, mockInterviewers } from '@/lib/mock-data'

class InstructorAvailabilityService extends BaseService<InstructorAvailability> {
  private interviewers: Interviewer[] = []

  constructor() {
    super({ tableName: 'instructor_availability', useMock: true })
    this.setMockData(mockInstructorAvailability)
    this.interviewers = [...mockInterviewers]
  }

  async getByInterviewer(interviewerId: string): Promise<InstructorAvailability[]> {
    const all = await this.getAll()
    return all.filter((a) => a.interviewer_id === interviewerId)
  }

  async getByDateRange(startDate: string, endDate: string): Promise<InstructorAvailability[]> {
    const all = await this.getAll()
    return all.filter((a) => {
      return a.date >= startDate && a.date <= endDate
    })
  }

  async getAvailableSlots(interviewerId: string, date: string): Promise<InstructorAvailability[]> {
    const all = await this.getByInterviewer(interviewerId)
    return all.filter((a) => a.date === date && a.status === 'available')
  }

  async getInterviewers(): Promise<Interviewer[]> {
    return [...this.interviewers]
  }

  async getInterviewerById(id: string): Promise<Interviewer | null> {
    return this.interviewers.find((i) => i.id === id) ?? null
  }
}

export const instructorAvailabilityService = new InstructorAvailabilityService()
