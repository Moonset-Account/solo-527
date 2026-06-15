export interface ProcessingRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  operator: string;
  operatorName: string;
  details: string;
  previousValue: string;
  newValue: string;
  createdAt: string;
}
