export type UserRole = 'resident' | 'admin';

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  id_card?: string;
  area?: string;
  building?: string;
  unit?: string;
  room?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type TopicType = 'vote' | 'survey' | 'announcement';
export type TopicStatus = 'draft' | 'ongoing' | 'ended';

export interface Topic {
  id: string;
  title: string;
  description: string;
  type: TopicType;
  status: TopicStatus;
  start_time: string;
  end_time: string;
  target_area?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  options?: TopicOption[];
  created_by_profile?: Profile;
  vote_count?: number;
}

export interface TopicOption {
  id: string;
  topic_id: string;
  label: string;
  description?: string;
  sort_order: number;
}

export interface Vote {
  id: string;
  topic_id: string;
  resident_id: string;
  option_id: string;
  voted_at: string;
  option?: TopicOption;
  topic?: Topic;
}

export type RectificationStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'rework';

export interface Rectification {
  id: string;
  title: string;
  description: string;
  type: string;
  status: RectificationStatus;
  location: string;
  assignee_id: string;
  deadline: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  logs?: RectificationLog[];
}

export interface RectificationLog {
  id: string;
  rectification_id: string;
  operator_id: string;
  action: string;
  from_status?: string;
  to_status?: string;
  remark?: string;
  created_at: string;
  operator?: Profile;
}

export type PatrolStatus = 'pending' | 'in_progress' | 'completed';

export interface PatrolTask {
  id: string;
  title: string;
  area: string;
  scheduled_at: string;
  executor_id: string;
  status: PatrolStatus;
  created_at: string;
  updated_at: string;
  executor?: Profile;
  check_items?: PatrolCheckItem[];
}

export type FacilityStatus = 'good' | 'damaged' | 'missing';

export interface PatrolCheckItem {
  id: string;
  patrol_task_id: string;
  name: string;
  facility_type: string;
  status: FacilityStatus;
  remark?: string;
}

export type ReportStatus = 'pending' | 'processing' | 'resolved';

export interface ReportRecord {
  id: string;
  title: string;
  type: string;
  location: string;
  reporter: string;
  report_time: string;
  status: ReportStatus;
  duplicate_count: number;
  first_report_at: string;
  last_report_at: string;
  handler_id?: string;
  resolved_at?: string;
  resolution?: string;
  created_at: string;
  handler?: Profile;
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportTask {
  id: string;
  type: string;
  name: string;
  filters: Record<string, any>;
  format: ExportFormat;
  status: ExportStatus;
  file_url?: string;
  file_size?: number;
  download_count: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
  created_by_profile?: Profile;
  download_logs?: ExportDownloadLog[];
}

export interface ExportDownloadLog {
  id: string;
  export_task_id: string;
  downloaded_by: string;
  downloaded_at: string;
  downloaded_by_profile?: Profile;
}

export interface OperationLog {
  id: string;
  operator_id: string;
  module: string;
  action: string;
  target_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  operator?: Profile;
}

export interface ResidentParticipation {
  resident_id: string;
  name: string;
  area?: string;
  building?: string;
  total_votes: number;
  last_participation_at: string | null;
  participation_rate: number;
  status: 'active' | 'inactive' | 'new';
}

export interface StatsOverview {
  total_residents: number;
  total_topics: number;
  pending_tasks: number;
  facility_good_rate: number;
  topics_ongoing: number;
  topics_ended: number;
  rectifications_pending: number;
  rectifications_completed: number;
  patrols_today: number;
  reports_pending: number;
  reports_processing: number;
  reports_resolved: number;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  ongoing: '进行中',
  ended: '已结束',
  pending: '待处理',
  in_progress: '处理中',
  review: '待复查',
  completed: '已完成',
  rework: '需返工',
  processing: '处理中',
  resolved: '已解决',
  good: '完好',
  damaged: '损坏',
  missing: '丢失',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ongoing: 'bg-blue-100 text-blue-700',
  ended: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  rework: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  good: 'bg-green-100 text-green-700',
  damaged: 'bg-red-100 text-red-700',
  missing: 'bg-orange-100 text-orange-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  new: 'bg-blue-100 text-blue-700',
};

export const RECTIFICATION_TYPES = [
  '设施维修',
  '环境整治',
  '安全隐患',
  '噪音扰民',
  '违章建筑',
  '其他',
];

export const PATROL_FACILITY_TYPES = [
  '消防设施',
  '监控设备',
  '照明设施',
  '健身器材',
  '门禁系统',
  '电梯',
  '公共座椅',
  '绿化设施',
];

export const REPORT_TYPES = [
  '设施损坏',
  '环境卫生',
  '噪音污染',
  '占道经营',
  '违章停车',
  '安全隐患',
  '其他',
];
