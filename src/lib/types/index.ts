export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'officer' | 'admin';
  created_at: string;
}

export interface Visit {
  id: string;
  created_by: string;
  visit_date: string;
  location: string;
  content: string;
  status: 'draft' | 'submitted' | 'published';
  created_at: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  visit_id: string;
  image_url: string;
  caption: string | null;
  description: string | null;
  review_status: 'pending' | 'approved' | 'rejected';
  review_notes: string | null;
  created_at: string;
}

export interface PhotoReview {
  id: string;
  photo_id: string;
  reviewer_id: string;
  status: 'approved' | 'rejected';
  comment: string | null;
  created_at: string;
}

export interface Recipient {
  id: string;
  name: string;
  age: number | null;
  school: string | null;
  grade: string | null;
  bio: string | null;
  avatar_url?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  recipient_id: string;
  type: 'story' | 'letter' | 'grade';
  content: string;
  created_at: string;
  recipient?: Recipient;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  description: string | null;
  created_at: string;
  expenses?: Expense[];
}

export interface Expense {
  id: string;
  category_id: string;
  donation_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
  category?: BudgetCategory;
}

export interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  payment_method: string;
  is_recurring: boolean;
  created_at: string;
}

export interface ExceptionRecord {
  id: string;
  type: 'material_discrepancy' | 'budget_overrun' | 'other';
  title: string;
  status: 'pending' | 'investigating' | 'handling' | 'closed';
  impact_scope: string;
  handling_path: string | null;
  review_notes: string | null;
  close_reason: string | null;
  parent_exception_id: string | null;
  created_at: string;
  updated_at: string;
  logs?: ExceptionLog[];
}

export interface ExceptionLog {
  id: string;
  exception_id: string;
  action_type: 'status_change' | 'note' | 'handling' | 'other';
  content: string;
  created_by: string | null;
  created_at: string;
  handler?: Profile;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  updated_by: string | null;
  updated_at: string;
}

export interface AchievementPhoto {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  totalRaised: number;
  totalExpenses: number;
  beneficiaryCount: number;
  serviceHours: number;
  visitCount: number;
  donationCount: number;
  pendingPhotos: number;
  openExceptions: number;
}
