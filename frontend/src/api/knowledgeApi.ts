import request from '@/utils/request';
import type {
  KnowledgeItem,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  HotSearch,
  QueryHistory,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const knowledgeApi = {
  searchKnowledge: async (
    params: KnowledgeSearchParams
  ): Promise<ApiResponse<PaginatedResponse<KnowledgeSearchResult>>> => {
    return request.get('/knowledge/search', { params });
  },

  getKnowledgeItem: async (id: string): Promise<ApiResponse<KnowledgeItem>> => {
    return request.get(`/knowledge/${id}`);
  },

  getHotSearches: async (limit: number = 10): Promise<ApiResponse<HotSearch[]>> => {
    return request.get('/knowledge/hot-searches', { params: { limit } });
  },

  setReminder: async (knowledgeId: string, remindAt: string): Promise<ApiResponse<void>> => {
    return request.post('/knowledge/reminders', { knowledgeId, remindAt });
  },

  recordQuery: async (keyword: string): Promise<ApiResponse<void>> => {
    return request.post('/knowledge/record-query', { keyword });
  },

  getQueryHistory: async (limit: number = 10): Promise<ApiResponse<QueryHistory[]>> => {
    return request.get('/knowledge/query-history', { params: { limit } });
  },
};
