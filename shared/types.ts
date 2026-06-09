export type Role = 'admin' | 'manager' | 'reviewer' | 'member';

export type ActionItemStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface Speaker {
  id: string;
  name: string;
  role?: string;
  color: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  startTime?: string;
  endTime?: string;
  text: string;
  originalText?: string;
  charOffset?: number;
}

export interface EvidenceSpan {
  segmentId: string;
  startChar: number;
  endChar: number;
  quotedText: string;
}

export type FieldName =
  | 'content'
  | 'assignee'
  | 'dueDate'
  | 'topic'
  | 'milestone'
  | 'priority';

export interface FieldConfidence {
  field: FieldName;
  confidence: number;
  level: ConfidenceLevel;
  reason?: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignee: string | null;
  assigneeStatus: 'confirmed' | 'pending_assignment' | 'ai_suggested';
  dueDate: string | null;
  topic: string | null;
  milestoneId: string | null;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: ActionItemStatus;
  fieldConfidences: FieldConfidence[];
  evidence: EvidenceSpan[];
  modelVersion: string;
  aiRaw?: unknown;
  missingFields: string[];
  lowConfidenceFields: string[];
  remarks: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface VersionHistory {
  id: string;
  actionItemId: string;
  version: number;
  snapshot: Partial<ActionItem>;
  diff: Record<string, { old: unknown; new: unknown }>;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  remark?: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  projectId: string;
  speakers: Speaker[];
  topics: string[];
  maskingApplied: boolean;
  status: 'created' | 'extracting' | 'extracted' | 'failed';
  extractionError?: string;
  actionItemCount?: number;
  createdAt: string;
  createdBy: string;
}

export interface Meeting extends MeetingListItem {
  transcript: TranscriptSegment[];
}

export interface ApiCallLog {
  id: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  statusCode: number;
  errorMessage?: string;
  userId: string;
  timestamp: string;
}

export interface MaskingRule {
  id: string;
  name: string;
  type: 'regex' | 'keyword';
  pattern: string;
  replacement: string;
  enabled: boolean;
}

export interface MaskingMapEntry {
  id: string;
  meetingId: string;
  maskedToken: string;
  originalValue: string;
  ruleId: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'at_risk' | 'cancelled';
  actionItemIds: string[];
  createdAt: string;
}

export interface ModelVersion {
  id: string;
  name: string;
  openaiFinetuneId?: string;
  baseModel: string;
  status: 'pending' | 'running' | 'ready' | 'failed';
  isActive: boolean;
  metrics?: { precision?: number; recall?: number; f1?: number; [k: string]: unknown };
  createdAt: string;
}

export interface EvaluationReport {
  generatedAt: string;
  totalSamples: number;
  overall: { precision: number; recall: number; f1: number };
  perField: Record<string, { precision: number; recall: number; f1: number; accuracy: number }>;
  errorDistribution: { missing: number; lowConfidence: number; wrongAssignee: number; wrongDate: number; other: number };
  modelVersion: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface DbModelVersionRow {
  id: string;
  name: string;
  openai_finetune_id?: string | null;
  base_model: string;
  status: string;
  is_active: number | boolean;
  metrics_json?: string | null;
  created_at: string;
}
export interface DbActionItemRow {
  id: string;
  meeting_id: string;
  content: string;
  assignee?: string | null;
  assignee_status: string;
  due_date?: string | null;
  topic?: string | null;
  milestone_id?: string | null;
  priority: string;
  status: string;
  field_confidences_json: string;
  evidence_json: string;
  model_version: string;
  missing_fields_json: string;
  low_confidence_fields_json: string;
  remarks: string;
  version: number;
  updated_by: string;
  created_at: string;
  updated_at: string;
}
export interface DbUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  created_at: string;
}
export interface DbMeetingRow {
  id: string;
  title: string;
  meeting_date: string;
  project_id: string;
  speakers_json: string;
  topics_json: string;
  status: string;
  extraction_error?: string | null;
  masking_applied: number | boolean;
  created_by: string;
  created_at: string;
}
export interface DbSegmentRow {
  id: string;
  meeting_id: string;
  speaker_id: string;
  start_time?: string | null;
  end_time?: string | null;
  text: string;
  original_text?: string | null;
  char_offset: number;
}
export interface DbVersionHistoryRow {
  id: string;
  action_item_id: string;
  version: number;
  snapshot_json: string;
  diff_json: string;
  operator_id: string;
  operator_name: string;
  remark?: string | null;
  timestamp: string;
}
export interface DbMilestoneRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  due_date?: string | null;
  status: string;
  action_item_ids_json: string;
  created_at: string;
}
export interface DbMaskingRuleRow {
  id: string;
  name: string;
  type: string;
  pattern: string;
  replacement: string;
  enabled: number | boolean;
}
