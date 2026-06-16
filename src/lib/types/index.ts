export type UserRole = 'supervisor' | 'editor' | 'shooter' | 'cutter';
export type MaterialType = 'image' | 'video' | 'document' | 'audio';
export type TopicStatus = 'draft' | 'pending_approval' | 'approved' | 'in_production' | 'published' | 'archived';
export type TaskType = 'shooting' | 'editing';
export type TaskStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewing' | 'completed';
export type ScheduleStatus = 'scheduled' | 'published' | 'cancelled';
export type AnomalyType = 'version_conflict';
export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyStatus = 'open' | 'investigating' | 'resolving' | 'closed';
export type ReuseTargetType = 'topic' | 'task' | 'schedule';
export type RefType = 'material' | 'task' | 'schedule';

export interface User { id: string; name: string; email: string; role: UserRole; createdAt: Date; }
export interface Tag { id: string; name: string; category: string; }
export interface Material { id: string; title: string; type: MaterialType; fileUrl: string; fileSize: number; uploadedBy: string; createdAt: Date; tags: Tag[]; reuseCount: number; }
export interface MaterialReuse { id: string; materialId: string; targetType: ReuseTargetType; targetId: string; usedBy: string; usedAt: Date; }
export interface Topic { id: string; title: string; description: string; status: TopicStatus; createdBy: string; approvedBy: string | null; createdAt: Date; updatedAt: Date; materials: Material[]; scripts: Script[]; }
export interface Script { id: string; topicId: string; content: string; version: number; createdBy: string; createdAt: Date; }
export interface SourceRecord { id: string; topicId: string; createdBy: string; createdAt: Date; supplementaryNotes: string; references: SourceReference[]; }
export interface SourceReference { id: string; sourceRecordId: string; refType: RefType; refId: string; refLabel: string; }
export interface Task { id: string; topicId: string; type: TaskType; title: string; description: string; status: TaskStatus; assigneeId: string; deadline: string; createdBy: string; createdAt: Date; updatedAt: Date; deliverables: Deliverable[]; }
export interface Deliverable { id: string; taskId: string; fileUrl: string; fileType: string; submittedAt: Date; note: string; }
export interface Schedule { id: string; topicId: string; platform: string; accountName: string; publishDate: string; publishTime: string; status: ScheduleStatus; supplementaryNotes: string; createdBy: string; createdAt: Date; }
export interface Anomaly { id: string; topicId: string; type: AnomalyType; severity: AnomalySeverity; description: string; status: AnomalyStatus; createdBy: string; createdAt: Date; closedBy: string | null; closedAt: Date | null; closureNote: string; }

export interface DashboardStats { topicsByStatus: Record<TopicStatus, number>; tasksByStatus: Record<TaskStatus, number>; openAnomalies: number; upcomingSchedules: Schedule[]; }

export interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = { draft: '草稿', pending_approval: '待审批', approved: '已通过', in_production: '制作中', published: '已发布', archived: '已归档' };
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { assigned: '待接单', in_progress: '进行中', submitted: '已提交', reviewing: '审核中', completed: '已完成' };
export const TASK_TYPE_LABELS: Record<TaskType, string> = { shooting: '拍摄', editing: '剪辑' };
export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = { scheduled: '已排期', published: '已发布', cancelled: '已取消' };
export const ANOMALY_SEVERITY_LABELS: Record<AnomalySeverity, string> = { low: '低', medium: '中', high: '高' };
export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = { open: '待处理', investigating: '调查中', resolving: '处理中', closed: '已关闭' };
export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = { image: '图片', video: '视频', document: '文档', audio: '音频' };

export const PLATFORM_COLORS: Record<string, string> = { '微信公众号': '#07c160', '抖音': '#161823', '夯闻APP': '#e07a3a', '微博': '#ff8200', 'B站': '#00a1d6', '头条号': '#d4232a' };
