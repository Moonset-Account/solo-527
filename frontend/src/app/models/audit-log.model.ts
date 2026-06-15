export interface AuditLog {
  id: string;
  operator: string;
  operatorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}
