export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  REAGENT_MANAGER = 'reagent_manager',
  LAB_MANAGER = 'lab_manager',
  RESEARCHER = 'researcher',
  USER = 'user',
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED = 'picked',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ApplicationType {
  REAGENT = 'reagent',
  HAZARDOUS = 'hazardous',
  SAMPLE = 'sample',
}

export enum InstrumentStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
}

export enum HazardousCategory {
  EXPLOSIVE = 'explosive',
  FLAMMABLE = 'flammable',
  TOXIC = 'toxic',
  CORROSIVE = 'corrosive',
  OXIDIZING = 'oxidizing',
  RADIOACTIVE = 'radioactive',
}

export enum NotificationType {
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  SAFETY_COMPLIANCE = 'safety_compliance',
  SAMPLE_UNKNOWN = 'sample_unknown',
  MAINTENANCE_ALERT = 'maintenance_alert',
  SYSTEM_NOTICE = 'system_notice',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  CANCEL = 'cancel',
  PICK = 'pick',
  RETURN = 'return',
  CONFIRM = 'confirm',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum SampleStatus {
  STORAGE = 'storage',
  IN_USE = 'in_use',
  TRANSFERRED = 'transferred',
  DESTROYED = 'destroyed',
  UNKNOWN = 'unknown',
  ARCHIVED = 'archived',
}

export enum DictionaryType {
  REAGENT_CATEGORY = 'reagent_category',
  REAGENT_UNIT = 'reagent_unit',
  HAZARDOUS_LEVEL = 'hazardous_level',
  DEPARTMENT = 'department',
  LABORATORY = 'laboratory',
  POSITION = 'position',
  CUSTOM = 'custom',
}
