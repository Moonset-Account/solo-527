export enum Role {
  ADMIN = 'admin',
  DESIGNER = 'designer',
  CLIENT = 'client'
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}

export enum NotificationType {
  PROJECT_ASSIGNED = 'project_assigned',
  PROJECT_STATUS_CHANGED = 'project_status_changed',
  QUOTE_CREATED = 'quote_created',
  INVOICE_CREATED = 'invoice_created',
  PAYMENT_RECEIVED = 'payment_received',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  DEADLINE_REMINDER = 'deadline_reminder',
  COMMENT_ADDED = 'comment_added'
}

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  user_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id: number;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  hourly_rate?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee_id?: number;
  estimated_hours?: number;
  due_date?: string;
  order_index: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  project_id: number;
  hours: number;
  description?: string;
  entry_date: string;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: number;
  project_id: number;
  client_id: number;
  quote_number: string;
  title: string;
  description?: string;
  amount: number;
  tax?: number;
  discount?: number;
  total_amount: number;
  status: QuoteStatus;
  valid_until?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: number;
  project_id: number;
  client_id: number;
  invoice_number: string;
  title: string;
  description?: string;
  amount: number;
  tax?: number;
  discount?: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: PaymentStatus;
  paid_at?: string;
  note?: string;
  created_by: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  related_id?: number;
  related_type?: string;
  read: boolean;
  created_at: string;
}

export interface ProjectFile {
  id: number;
  project_id: number;
  name: string;
  file_path: string;
  file_size: number;
  uploaded_by: number;
  is_public: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  project_id: number;
  task_id?: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface RevenueStats {
  totalRevenue: number;
  paidInvoicedAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  totalHours: number;
  billableHours: number;
  projectCount: number;
  clientCount: number;
}
