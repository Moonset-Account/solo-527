export type UserRole = 'admin' | 'operator' | 'member';

export type CampStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type ChapterStatus = 'draft' | 'published';

export type MemberStatus = 'active' | 'expired' | 'refunded' | 'paused';

export type CheckinStatus = 'pending' | 'approved' | 'rejected';

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TodoType = 'fall_behind_warning' | 'checkin_review' | 'refund_review' | 'custom';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export type ConversionSource = 'wechat_group' | 'wechat_moments' | 'douyin' | 'xiaohongshu' | 'zhihu' | 'referral' | 'offline' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface TrainingCamp {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  startDate: Date;
  endDate: Date;
  status: CampStatus;
  maxMembers: number;
  currentMembers: number;
  price: number;
  operatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  campId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  sortOrder: number;
  status: ChapterStatus;
  isPreview: boolean;
  materials?: ChapterMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterMaterial {
  id: string;
  chapterId: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'other';
  url: string;
  fileSize?: number;
  createdAt: Date;
}

export interface CampMaterial {
  id: string;
  campId: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'zip' | 'other';
  url: string;
  fileSize?: number;
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  campId: string;
  memberNo: string;
  status: MemberStatus;
  joinDate: Date;
  expiryDate?: Date;
  conversionSource: ConversionSource;
  conversionSourceDetail?: string;
  lastActiveAt?: Date;
  progress: number;
  totalChapters: number;
  completedChapters: number;
  isFallingBehind: boolean;
  salesPerson?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  camp: TrainingCamp;
}

export interface CheckinRecord {
  id: string;
  memberId: string;
  chapterId: string;
  campId: string;
  content?: string;
  imageUrls?: string[];
  status: CheckinStatus;
  checkedInAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  member: Member;
  chapter: Chapter;
}

export interface RefundRule {
  id: string;
  campId: string;
  name: string;
  description: string;
  daysFromJoin: number;
  refundRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundRequest {
  id: string;
  memberId: string;
  ruleId?: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  requestedAt: Date;
  processedBy?: string;
  processedAt?: Date;
  processComment?: string;
  createdAt: Date;
  member: Member;
  rule?: RefundRule;
}

export interface MemberBenefit {
  id: string;
  memberId: string;
  type: 'discount' | 'gift' | 'service' | 'other';
  name: string;
  description?: string;
  value?: number;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  type: TodoType;
  priority: TodoPriority;
  status: TodoStatus;
  assigneeId?: string;
  memberId?: string;
  campId?: string;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  member?: Member;
  camp?: TrainingCamp;
}

export interface CompletionStats {
  campId: string;
  campName: string;
  totalMembers: number;
  completedMembers: number;
  activeMembers: number;
  fallingBehindMembers: number;
  completionRate: number;
  averageProgress: number;
  totalChapters: number;
  byDate: { date: string; completionRate: number }[];
}

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  handlerId?: string;
  campId?: string;
  conversionSource?: ConversionSource;
}

export const PaginationSchema = <T>(z: import('zod').ZodType<T>) => {
  return import('zod').z.object({
    items: z.array(),
    total: import('zod').z.number(),
    page: import('zod').z.number(),
    pageSize: import('zod').z.number(),
    totalPages: import('zod').z.number(),
  });
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
