export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ContractStatus = 'draft' | 'pending' | 'approving' | 'approved' | 'rejected' | 'signing' | 'signed' | 'archived' | 'cancelled';
export type ContractType = 'purchase' | 'sale' | 'service' | 'labor' | 'cooperation' | 'confidential' | 'other';
export type UrgencyLevel = 'normal' | 'urgent' | 'very_urgent';
export type UserDepartment = 'legal' | 'finance' | 'admin' | 'business' | 'hr' | 'other';

export interface Contract {
  id: string;
  contractNo: string;
  title: string;
  summary?: string;
  contractType: ContractType;
  status: ContractStatus;
  urgency: UrgencyLevel;
  partyA: string;
  partyB: string;
  amount: number;
  currency: string;
  effectiveDate?: string;
  expiryDate?: string;
  applicantId: string;
  ownerId?: string;
  materialChecklist?: { name: string; required: boolean; uploaded: boolean; remark?: string }[];
  materialsComplete: boolean;
  rejectionReason?: string;
  customFields?: Record<string, any>;
  applicant?: { id: string; realName: string; department?: string };
  owner?: { id: string; realName: string };
  attachments?: ContractAttachment[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type AttachmentType = 'contract_main' | 'appendix' | 'proof' | 'id_card' | 'business_license' | 'tax_certificate' | 'other';
export type AttachmentStatus = 'uploaded' | 'verified' | 'rejected' | 'expired';

export interface ContractAttachment {
  id: string;
  contractId: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  attachmentType: AttachmentType;
  status: AttachmentStatus;
  reviewRemark?: string;
  uploaderId: string;
  permissionConfig?: { viewUsers: string[]; downloadUsers: string[]; viewRoles: string[]; downloadRoles: string[]; public: boolean };
  downloadCount: number;
  viewCount: number;
  fileHash?: string;
  uploader?: { id: string; realName: string };
  uploadedAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'transferred' | 'skipped';
export type ApprovalNodeType = 'and' | 'or' | 'single';

export interface ApprovalStep {
  id: string;
  nodeName: string;
  stepOrder: number;
  approver?: { id: string; realName: string; avatar?: string; phone?: string };
  transferredTo?: { id: string; realName: string };
  status: ApprovalStatus;
  opinion?: string;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  durationHours?: number;
}

export interface ApprovalProgress {
  contract: { id: string; contractNo: string; title: string; status: ContractStatus; urgency: UrgencyLevel; applicant?: { id: string; realName: string }; createdAt: string };
  currentStep: number;
  totalSteps: number;
  steps: ApprovalStep[];
}

export interface ApprovalTask {
  id: string;
  nodeName: string;
  stepOrder: number;
  approverId: string;
  status: ApprovalStatus;
  opinion?: string;
  rejectionReason?: string;
  approvedAt?: string;
  contract: Contract;
  createdAt: string;
}

export type ConflictStatus = 'open' | 'assigned' | 'resolving' | 'resolved' | 'escalated' | 'closed';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ConflictType = 'number_conflict' | 'file_lock' | 'amount_discrepancy' | 'party_conflict' | 'date_overlap' | 'deadlock' | 'permission_denied' | 'other';

export interface ConflictRecord {
  id: string;
  contractId?: string;
  title: string;
  description: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  status: ConflictStatus;
  impactScope?: string;
  affectedResources?: string;
  handlerId?: string;
  reporterId?: string;
  nextSteps?: string;
  resolution?: string;
  timeline?: { time: string; actor: string; action: string; remark: string }[];
  resolvedAt?: string;
  contract?: { id: string; contractNo: string; title: string };
  handler?: { id: string; realName: string };
  reporter?: { id: string; realName: string };
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'approval_request' | 'approval_result' | 'material_incomplete' | 'material_complete' | 'contract_rejected' | 'contract_approved' | 'conflict_created' | 'conflict_resolved' | 'archive_reminder' | 'system' | 'callback_failure' | 'custom';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'wechat' | 'dingtalk';
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'retrying' | 'read';

export interface Notification {
  id: string;
  recipientId?: string;
  recipientTarget?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  content?: string;
  relatedData?: { contractId?: string; approvalId?: string; conflictId?: string; callbackId?: string; extra?: Record<string, any> };
  status: NotificationStatus;
  retryCount: number;
  failureReason?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export type CallbackType = 'notification' | 'payment' | 'esign' | 'sms' | 'email' | 'wechat' | 'webhook';
export type CallbackStatus = 'pending' | 'processing' | 'success' | 'failed' | 'retrying' | 'cancelled' | 'timeout';

export interface CallbackLog {
  id: string;
  requestId: string;
  callbackType: CallbackType;
  status: CallbackStatus;
  targetUrl: string;
  httpMethod: string;
  requestPayload?: string;
  requestHeaders?: Record<string, string>;
  retryCount: number;
  maxRetryCount: number;
  nextRetryAt?: string;
  failureReason?: string;
  responseStatusCode?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  durationMs?: number;
  relatedId?: string;
  relatedType?: string;
  retryHistory?: { attempt: number; time: string; status: string; statusCode: number; error: string; durationMs: number }[];
  firstAttemptAt?: string;
  lastAttemptAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NumberPoolStatus = 'available' | 'used' | 'reserved' | 'expired' | 'cancelled';

export interface ContractNumberPool {
  id: string;
  contractNo: string;
  prefix: string;
  year: number;
  seqNo: number;
  status: NumberPoolStatus;
  contractId?: string;
  ruleType: string;
  usedAt?: string;
  reservedExpireAt?: string;
  createdAt: string;
}

export interface FileResource {
  id: string;
  resourceKey: string;
  resourceName: string;
  resourceType: string;
  size: number;
  isLocked: boolean;
  lockerId?: string;
  lockerName?: string;
  contractId?: string;
  description?: string;
  lockedAt?: string;
  lockExpireAt?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  sort: number;
  enabled: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
  parentId?: string;
  sort: number;
  createdAt: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}
