export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'student' | 'mentor' | 'admin';
  status: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
}

export interface Student {
  id: number;
  user: User;
  student_id: string;
  school: string;
  department: string;
  major: string;
  grade: string;
  expected_graduation?: string;
  target_industries: string[];
  target_positions: string[];
  resume_url?: string;
  bio?: string;
  review_status: string;
}

export interface Mentor {
  id: number;
  user: User;
  alumni_id: string;
  graduation_year: number;
  school: string;
  department: string;
  major: string;
  current_company: string;
  current_position: string;
  years_of_experience: number;
  industry_tags: string[];
  expertise_areas: string[];
  bio?: string;
  average_rating: number;
  total_meetings: number;
  review_status: string;
  contact_visible: boolean;
}

export interface TimeSlot {
  id: number;
  mentor_id: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface Appointment {
  id: number;
  student_id: number;
  mentor_id: number;
  time_slot_id: number;
  title: string;
  description?: string;
  topics: string[];
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  meeting_type: string;
  meeting_link?: string;
  meeting_location?: string;
  qr_code?: string;
  contact_unlocked: boolean;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  student?: Student;
  mentor?: Mentor;
  time_slot?: TimeSlot;
  feedback?: Feedback;
}

export interface Feedback {
  id: number;
  appointment_id: number;
  student_id: number;
  mentor_id: number;
  student_rating?: number;
  student_comment?: string;
  student_answers?: Record<string, any>;
  student_submitted_at?: string;
  mentor_rating?: number;
  mentor_comment?: string;
  mentor_answers?: Record<string, any>;
  mentor_submitted_at?: string;
  is_complete: boolean;
  created_at: string;
}

export interface FeedbackQuestion {
  id: number;
  question_type: string;
  question_text: string;
  target_role: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content?: string;
  related_type?: string;
  related_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface IndustryTag {
  id: number;
  name: string;
  name_en?: string;
  category?: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Attachment {
  id: number;
  appointment_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  is_offline_upload: boolean;
  offline_sync_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  appointment_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface MatchRecommendation {
  mentor: Mentor;
  match_score: number;
  match_reasons: string[];
}

export interface DashboardStats {
  overview: {
    total_users: number;
    total_mentors: number;
    total_students: number;
    total_appointments: number;
    completed_appointments: number;
    completion_rate: number;
    average_rating: number;
  };
  pending: {
    mentors: number;
    students: number;
    appointments: number;
  };
  trends: {
    appointments_this_week: number;
    appointments_this_month: number;
  };
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
