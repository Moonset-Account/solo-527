export interface InspectionTask {
  id: string;
  templateId: string;
  templateName: string;
  assignee: string;
  status: string;
  startedAt: string;
  completedAt: string;
  results: InspectionTaskResult[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTaskResult {
  itemName: string;
  actualValue: string;
  expectedValue: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  notes: string;
}
