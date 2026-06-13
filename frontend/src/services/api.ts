import axios from 'axios';
import {
  User, Event, Task, Todo, Vote, VoteRule, VoteRecord,
  Attachment, Note, History,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/users/login', { username, password }),
};

export const userApi = {
  getUsers: (params?: any) => api.get<User[]>('/users', { params }),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  createUser: (data: any) => api.post<User>('/users', data),
  updateUser: (id: string, data: any) => api.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export const eventApi = {
  getEvents: (params?: any) => api.get<Event[]>('/events', { params }),
  getEvent: (id: string) => api.get<Event>(`/events/${id}`),
  getEventStats: () => api.get('/events/stats'),
  createEvent: (data: any) => api.post<Event>('/events', data),
  updateEvent: (id: string, data: any) => api.put<Event>(`/events/${id}`, data),
  deleteEvent: (id: string, operatorId: string) => api.delete(`/events/${id}`, { data: { operatorId } }),
  getNotes: (eventId: string) => api.get<Note[]>(`/events/${eventId}/notes`),
  addNote: (data: any) => api.post<Note>(`/events/${data.eventId}/notes`, data),
  getAttachments: (eventId: string) => api.get<Attachment[]>(`/events/${eventId}/attachments`),
  uploadAttachment: (eventId: string, uploaderId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);
    return api.post<Attachment>(`/events/${eventId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getHistories: (eventId: string) => api.get<History[]>(`/events/${eventId}/histories`),
};

export const voteApi = {
  getVotes: (params?: any) => api.get<Vote[]>('/votes', { params }),
  getVote: (id: string) => api.get<Vote>(`/votes/${id}`),
  createVote: (data: any) => api.post<Vote>('/votes', data),
  updateVote: (id: string, data: any) => api.put<Vote>(`/votes/${id}`, data),
  startVote: (id: string) => api.post<Vote>(`/votes/${id}/start`),
  endVote: (id: string) => api.post<Vote>(`/votes/${id}/end`),
  castVote: (id: string, data: any) => api.post<VoteRecord>(`/votes/${id}/vote`, data),
  getVoteRecords: (id: string) => api.get<VoteRecord[]>(`/votes/${id}/records`),
  getVoteRecord: (voteId: string, voterId: string) => api.get<VoteRecord>(`/votes/${voteId}/record/${voterId}`),
  getRules: () => api.get<VoteRule[]>('/votes/rules'),
  getRule: (id: string) => api.get<VoteRule>(`/votes/rules/${id}`),
  createRule: (data: any) => api.post<VoteRule>('/votes/rules', data),
  updateRule: (id: string, data: any) => api.put<VoteRule>(`/votes/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/votes/rules/${id}`),
};

export const taskApi = {
  getTasks: (params?: any) => api.get<Task[]>('/tasks', { params }),
  getTask: (id: string) => api.get<Task>(`/tasks/${id}`),
  getTaskStats: () => api.get('/tasks/stats'),
  createTask: (data: any) => api.post<Task>('/tasks', data),
  updateTask: (id: string, data: any) => api.put<Task>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

export const todoApi = {
  getTodos: (params?: any) => api.get<Todo[]>('/todos', { params }),
  getTodo: (id: string) => api.get<Todo>(`/todos/${id}`),
  getTodoStats: () => api.get('/todos/stats'),
  createTodo: (data: any) => api.post<Todo>('/todos', data),
  updateTodo: (id: string, data: any) => api.put<Todo>(`/todos/${id}`, data),
  deleteTodo: (id: string) => api.delete(`/todos/${id}`),
};

export const reportApi = {
  getHelpProgress: (params?: any) => api.get('/reports/help-progress', { params }),
  getEventClosure: () => api.get('/reports/event-closure'),
  getPerformance: (params?: any) => api.get('/reports/performance', { params }),
  getVoteParticipation: () => api.get('/reports/vote-participation'),
  getShiftStats: () => api.get('/reports/shift-stats'),
};

export default api;
