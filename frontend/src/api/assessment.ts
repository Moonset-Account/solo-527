import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface Assessment {
  id: string;
  resumeId: string;
  candidateName: string;
  questionBankId?: string;
  questionBankName?: string;
  status: string;
  totalScore?: number;
  earnedScore?: number;
  answers?: { questionId: string; answer: string; score: number; gradedBy?: string }[];
  abilityScores?: { ability: string; score: number; maxScore: number }[];
  overallFeedback?: string;
  gradedById?: string;
  gradedByName?: string;
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  hasDispute: boolean;
  disputeReason?: string;
  isDisputeResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringCriterion {
  id: string;
  name: string;
  category: string;
  maxScore: number;
  passScore: number;
  dimensions: {
    name: string;
    weight: number;
    description: string;
    scoringGuide: string;
  }[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const assessmentApi = {
  createAssessment: (data: any): Promise<ApiResponse<Assessment>> =>
    api.post('/assessments', data),

  getAssessments: (params?: {
    resumeId?: string;
    status?: string;
    hasDispute?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Assessment>>> =>
    api.get('/assessments', { params }),

  getAssessmentById: (id: string): Promise<ApiResponse<Assessment>> =>
    api.get(`/assessments/${id}`),

  startAssessment: (id: string): Promise<ApiResponse<Assessment>> =>
    api.put(`/assessments/${id}/start`),

  submitAssessment: (id: string, answers: any[]): Promise<ApiResponse<Assessment>> =>
    api.put(`/assessments/${id}/submit`, { answers }),

  gradeAssessment: (id: string, data: any): Promise<ApiResponse<Assessment>> =>
    api.put(`/assessments/${id}/grade`, data),

  raiseDispute: (id: string, reason: string): Promise<ApiResponse<Assessment>> =>
    api.post(`/assessments/${id}/dispute`, { reason }),

  resolveDispute: (id: string, resolved: boolean, resolution?: string): Promise<ApiResponse<Assessment>> =>
    api.post(`/assessments/${id}/dispute/resolve`, { resolved, resolution }),

  createScoringCriterion: (data: any): Promise<ApiResponse<ScoringCriterion>> =>
    api.post('/assessments/criteria', data),

  getScoringCriteria: (category?: string): Promise<ApiResponse<ScoringCriterion[]>> =>
    api.get('/assessments/criteria/list', { params: { category } }),

  getScoringCriterionById: (id: string): Promise<ApiResponse<ScoringCriterion>> =>
    api.get(`/assessments/criteria/${id}`),

  updateScoringCriterion: (id: string, data: any): Promise<ApiResponse<ScoringCriterion>> =>
    api.put(`/assessments/criteria/${id}`, data),
};
