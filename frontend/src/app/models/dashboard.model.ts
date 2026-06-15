export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  totalFaults: number;
  openFaults: number;
  activeAlerts: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

export interface TimelinessData {
  labels: string[];
  avgProcessingTimes: number[];
  slaComplianceRates: number[];
}

export interface TodoItem {
  id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}
