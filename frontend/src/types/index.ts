export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'user';
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory = 'technical' | 'billing' | 'feature' | 'other';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userId: string;
  user?: User;
  assigneeId?: string;
  assignee?: User;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  content: string;
  userId: string;
  user?: User;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  author?: User;
  views: number;
  likes: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface TicketFilterParams extends PaginationParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  userId?: string;
  assigneeId?: string;
  search?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  username: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TicketStatistics {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  byPriority: Record<TicketPriority, number>;
  byCategory: Record<TicketCategory, number>;
  trendData: { date: string; count: number }[];
}

export interface TodoStats {
  total: number;
  urgent: number;
  due_soon: number;
}

export interface ExceptionStats {
  overdue: number;
  escalated_no_response: number;
  repeated_complaints: number;
}

export interface ReportStats {
  today_tickets: number;
  today_resolved: number;
  avg_response_time: number;
  resolution_rate: number;
}

export interface DashboardStats {
  todo: TodoStats;
  exceptions: ExceptionStats;
  reports: ReportStats;
}

export interface TicketTimeline {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  user?: User;
  createdAt: string;
  extra?: Record<string, unknown>;
}

export interface TicketDetail extends Ticket {
  customerName: string;
  customerPhone: string;
  orderNo: string;
  orderAmount: number;
  firstResponseTime?: number;
  totalDuration?: number;
  nodeDurations?: { node: string; duration: number }[];
  isEscalated: boolean;
  escalationReason?: string;
  escalationLevel?: number;
  timeline: TicketTimeline[];
  notes: TicketNote[];
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  customerName: string;
  customerPhone: string;
  orderNo?: string;
  tags?: string[];
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigneeId?: string;
  title?: string;
  description?: string;
  resolution?: string;
}

export interface KnowledgeSearchParams extends PaginationParams {
  keyword: string;
  category?: string;
}

export interface KnowledgeSearchResult {
  item: KnowledgeItem;
  matchScore: number;
  hitCount: number;
  highlightTitle?: string;
  highlightContent?: string;
}

export interface HotSearch {
  keyword: string;
  count: number;
}

export interface QueryHistory {
  id: string;
  keyword: string;
  createdAt: string;
}

export interface ServiceTicketFilter extends PaginationParams {
  agentId?: string;
  startDate?: string;
  endDate?: string;
  status?: TicketStatus;
  result?: string;
}

export interface QualityCheck {
  id: string;
  ticketId: string;
  ticket?: TicketDetail;
  checkerId: string;
  checker?: User;
  score: number;
  comments: string;
  criteria: { name: string; score: number; maxScore: number }[];
  createdAt: string;
}

export interface CreateQualityCheckData {
  ticketId: string;
  score: number;
  comments: string;
  criteria: { name: string; score: number; maxScore: number }[];
}

export interface Improvement {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  assignee?: User;
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImprovementData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateImprovementData {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress?: number;
  title?: string;
  description?: string;
  assigneeId?: string;
}

export interface DurationReport {
  category: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  count: number;
}

export interface ResultReport {
  status: string;
  count: number;
  percentage: number;
}

export interface TrendReport {
  date: string;
  ticketCount: number;
  escalationRate: number;
  satisfactionRate: number;
}

export interface ExportRequest {
  type: string;
  filters: Record<string, unknown>;
  startDate: string;
  endDate: string;
}

export interface ExportInfo {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
}
