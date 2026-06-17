import { BaseService } from './base-service'
import type { Assessment, Submission } from '@/types/database'
import { mockAssessments, mockSubmissions } from '@/lib/mock-data'

class AssessmentService extends BaseService<Assessment> {
  private submissions: Submission[] = []

  constructor() {
    super({ tableName: 'assessments', useMock: true })
    this.setMockData(mockAssessments)
    this.submissions = [...mockSubmissions]
  }

  async getActive(): Promise<Assessment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.is_active)
  }

  async getByCategory(category: string): Promise<Assessment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.category === category)
  }

  async getSubmissions(assessmentId?: string): Promise<Submission[]> {
    let subs = [...this.submissions]
    if (assessmentId) {
      subs = subs.filter((s) => s.assessment_id === assessmentId)
    }
    return subs
  }

  async getSubmissionById(id: string): Promise<Submission | null> {
    return this.submissions.find((s) => s.id === id) ?? null
  }

  async createSubmission(submission: Omit<Submission, 'id'> & { id?: string }): Promise<Submission> {
    const newSubmission: Submission = {
      ...submission,
      id: submission.id ?? `sub-${Date.now()}`,
    } as Submission
    this.submissions.push(newSubmission)
    return newSubmission
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    const index = this.submissions.findIndex((s) => s.id === id)
    if (index === -1) return null
    this.submissions[index] = { ...this.submissions[index], ...updates }
    return this.submissions[index]
  }
}

export const assessmentService = new AssessmentService()
