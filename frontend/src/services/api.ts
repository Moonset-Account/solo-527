import axios from 'axios';
import {
  Book,
  RecycleRecord,
  PriceScatterData,
  BookAnalysisData,
  FilterParams,
  ExportParams,
  PricingHistory,
  PriceComparison,
  SummaryData,
  BookPriceUpdate,
} from '../types';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const analyticsAPI = {
  getPriceScatter: (filters: FilterParams): Promise<PriceScatterData[]> =>
    api.post('/analytics/price-scatter', filters).then((res) => res.data),

  getBookAnalysis: (filters: FilterParams): Promise<BookAnalysisData[]> =>
    api.post('/analytics/book-analysis', filters).then((res) => res.data),

  getSummary: (): Promise<SummaryData> =>
    api.get('/analytics/summary').then((res) => res.data),
};

export const booksAPI = {
  getBooks: (params?: { isbn?: string; title?: string; skip?: number; limit?: number }): Promise<Book[]> =>
    api.get('/books/', { params }).then((res) => res.data),

  getBook: (id: number): Promise<Book> =>
    api.get(`/books/${id}`).then((res) => res.data),

  getBookByIsbn: (isbn: string): Promise<Book> =>
    api.get(`/books/isbn/${isbn}`).then((res) => res.data),

  createBook: (book: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> =>
    api.post('/books/', book).then((res) => res.data),

  updateBook: (id: number, book: Partial<Book>): Promise<Book> =>
    api.put(`/books/${id}`, book).then((res) => res.data),
};

export const recycleRecordsAPI = {
  getRecords: (params?: {
    isbn?: string;
    condition?: string;
    channel?: string;
    is_sold?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<RecycleRecord[]> =>
    api.get('/recycle-records/', { params }).then((res) => res.data),

  getRecord: (id: number): Promise<RecycleRecord> =>
    api.get(`/recycle-records/${id}`).then((res) => res.data),

  getRecordByNo: (recordNo: string): Promise<RecycleRecord> =>
    api.get(`/recycle-records/record-no/${recordNo}`).then((res) => res.data),
};

export const pricingAPI = {
  updatePrice: (bookId: number, data: BookPriceUpdate) =>
    api.post(`/pricing/book/${bookId}/update-price`, data).then((res) => res.data),

  getHistory: (isbn: string, condition?: string): Promise<PricingHistory[]> =>
    api.get(`/pricing/history/${isbn}`, { params: { condition } }).then((res) => res.data),

  getComparison: (isbn: string): Promise<PriceComparison[]> =>
    api.get(`/pricing/comparison/${isbn}`).then((res) => res.data),

  getVersions: (): Promise<any[]> =>
    api.get('/pricing/versions').then((res) => res.data),
};

export const exportAPI = {
  exportReport: (params: ExportParams): Promise<Blob> =>
    api.post('/export/report', params, { responseType: 'blob' }).then((res) => res.data),
};

export default api;
