import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface Question {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  defaultScore: number;
  scoringCriteria?: string;
  knowledgePoints?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  category: string;
  questionIds?: string[];
  totalScore: number;
  passScore: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const questionApi = {
  createQuestion: (data: any): Promise<ApiResponse<Question>> =>
    api.post('/questions/questions', data),

  getQuestions: (params?: {
    category?: string;
    difficulty?: string;
    type?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Question>>> =>
    api.get('/questions/questions', { params }),

  getCategories: (): Promise<ApiResponse<string[]>> =>
    api.get('/questions/questions/categories'),

  getQuestionById: (id: string): Promise<ApiResponse<Question>> =>
    api.get(`/questions/questions/${id}`),

  updateQuestion: (id: string, data: any): Promise<ApiResponse<Question>> =>
    api.put(`/questions/questions/${id}`, data),

  deleteQuestion: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/questions/questions/${id}`),

  createBank: (data: any): Promise<ApiResponse<QuestionBank>> =>
    api.post('/questions/banks', data),

  getBanks: (params?: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<QuestionBank>>> =>
    api.get('/questions/banks', { params }),

  getBankById: (id: string): Promise<ApiResponse<QuestionBank>> =>
    api.get(`/questions/banks/${id}`),

  getBankQuestions: (id: string): Promise<ApiResponse<Question[]>> =>
    api.get(`/questions/banks/${id}/questions`),

  updateBank: (id: string, data: any): Promise<ApiResponse<QuestionBank>> =>
    api.put(`/questions/banks/${id}`, data),
};
