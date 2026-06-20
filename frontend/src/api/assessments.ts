import request from '@/utils/request';
import { Assessment, SearchParams, PaginatedResult, HireResult } from '@/types';

export interface CreateAssessmentParams {
  interviewId: string;
  dimensions?: {
    dimension: string;
    score: number;
    weight: number;
    comment?: string;
  }[];
  totalScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  overallComment?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: HireResult;
  suggestedLevel?: string;
  suggestedSalary?: string;
  usedQuestions?: string[];
  isFinal?: boolean;
}

export const getAssessments = (params?: SearchParams): Promise<PaginatedResult<Assessment>> => {
  return request.get('/assessments', { params });
};

export const getAssessmentById = (id: string): Promise<Assessment> => {
  return request.get(`/assessments/${id}`);
};

export const getAssessmentByInterviewId = (interviewId: string): Promise<Assessment> => {
  return request.get(`/assessments/interview/${interviewId}`);
};

export const createAssessment = (data: CreateAssessmentParams): Promise<Assessment> => {
  return request.post('/assessments', data);
};

export const updateAssessment = (id: string, data: CreateAssessmentParams): Promise<Assessment> => {
  return request.patch(`/assessments/${id}`, data);
};

export const create = createAssessment;
