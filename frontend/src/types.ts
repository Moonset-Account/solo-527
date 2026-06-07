export type UserRole = 'project_manager' | 'teacher';

export type EventLevel = 'low' | 'medium' | 'high' | 'critical';

export type EventStatus = 'unconfirmed' | 'processing' | 'closed';

export type NotificationStatus = 'pending' | 'success' | 'failed';

export type AttachmentAccessRole = 'project_manager' | 'teacher' | 'all';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface SafetyEvent {
  id: string;
  title: string;
  description: string;
  level: EventLevel;
  status: EventStatus;
  checkpoint_id: string | null;
  checkpoint_name: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  actual_occurred_at: string;
  recorded_at: string;
  confirmed_at: string | null;
  closed_at: string | null;
  notification_status: NotificationStatus;
  notification_attempts: number;
  location_lat: number | null;
  location_lng: number | null;
  original_record_url: string | null;
  handle_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Attachment {
  id: string;
  event_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  access_role: AttachmentAccessRole;
  created_at: string;
}

export interface NotificationRateStats {
  total: number;
  success: number;
  failed: number;
  rate: number;
  by_level: Record<string, Record<string, number>>;
}

export interface EventStatusStats {
  unconfirmed: number;
  processing: number;
  closed: number;
  by_level: Record<string, Record<string, number>>;
}

export interface HandleDurationStats {
  overall_avg_minutes: number;
  by_level: Record<string, Record<string, number>>;
  by_date: Array<{ date: string; avg_minutes: number; count: number }>;
}

export interface PublicReportStats {
  total_events: number;
  event_level_distribution: Record<string, number>;
  avg_handle_duration_minutes: number;
  notification_success_rate: number;
  events_by_month: Array<{ month: string; count: number }>;
}

export interface EventListResponse {
  items: SafetyEvent[];
  total: number;
  page: number;
  page_size: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  level: EventLevel;
  checkpoint_id: string;
  actual_occurred_at: string;
  location_lat?: number;
  location_lng?: number;
  original_record_url?: string;
}
