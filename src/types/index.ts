export type UserRole = 'admin' | 'manager' | 'guide' | 'school_contact' | 'parent';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type SessionStatus = 'open' | 'full' | 'closed' | 'completed';
export type BookingType = 'group' | 'individual';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  capacity: number;
  duration_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
  teaching_aids?: TeachingAid[];
}

export interface Session {
  id: number;
  course_id: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: SessionStatus;
  guide_id?: number;
  location: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  guide?: Guide;
}

export interface Booking {
  id: number;
  type: BookingType;
  session_id: number;
  user_id: number;
  school_id?: number;
  total_count: number;
  status: BookingStatus;
  review_note?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
  session?: Session;
  user?: User;
}

export interface Participant {
  id: number;
  booking_id: number;
  name: string;
  age: number;
  checked_in: boolean;
  checked_in_at?: string;
}

export interface Guide {
  id: number;
  user_id: number;
  specialties: string;
  status: string;
  user?: User;
}

export interface ScheduleAssignment {
  id: number;
  session_id: number;
  guide_id: number;
  assigned_at: string;
  session?: Session;
  guide?: Guide;
}

export interface TeachingAid {
  id: number;
  name: string;
  total_quantity: number;
  available_quantity: number;
  status: string;
}

export interface Feedback {
  id: number;
  session_id: number;
  booking_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  created_at: string;
}

export interface School {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  address?: string;
  created_at: string;
}
