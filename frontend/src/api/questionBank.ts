import request from '@/utils/request';
import { Question, SearchParams, PaginatedResult, DifficultyLevel } from '@/types';

export interface CreateQuestionParams {
  title: string;
  content: string;
  type: string;
  difficulty: DifficultyLevel;
  category: string;
  tags?: string[];
  referenceAnswer?: string;
  analysis?: string;
  options?: string[];
  correctAnswers?: number[];
  isActive?: boolean;
  defaultScore?: number;
  estimatedTime?: number;
}

export const getQuestions = (params?: SearchParams): Promise<PaginatedResult<Question>> => {
  return request.get('/question-bank', { params });
};

export const getQuestionById = (id: string): Promise<Question> => {
  return request.get(`/question-bank/${id}`);
};

export const getCategories = (): Promise<string[]> => {
  return request.get('/question-bank/categories');
};

export const getQuestionStats = (): Promise<any> => {
  return request.get('/question-bank/statistics');
};

export const getRandomQuestions = (
  count: number = 5,
  category?: string,
  difficulty?: DifficultyLevel,
  excludeIds?: string,
): Promise<Question[]> => {
  return request.get('/question-bank/random', {
    params: { count, category, difficulty, excludeIds },
  });
};

export const createQuestion = (data: CreateQuestionParams): Promise<Question> => {
  return request.post('/question-bank', data);
};

export const updateQuestion = (id: string, data: CreateQuestionParams): Promise<Question> => {
  return request.patch(`/question-bank/${id}`, data);
};

export const deleteQuestion = (id: string): Promise<Question> => {
  return request.delete(`/question-bank/${id}`);
};
