export interface OverviewMetrics {
  totalEnergy: number;
  pue: number;
  onlineDevices: number;
  pendingWorkorders: number;
  energyTrend: number[];
  comparedToYesterday: number;
}

export interface EnergyTrendPoint {
  timestamp: string;
  value: number;
  category: 'total' | 'ac' | 'server' | 'lighting';
  deviceId?: string;
  isOffline: boolean;
}

export interface EnergyBreakdownItem {
  category: string;
  value: number;
  percentage: number;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity?: number;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'meter' | 'ac' | 'server' | 'ups';
  roomId?: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen?: string;
  createdAt: string;
}

export interface AlarmItem {
  id: string;
  deviceId?: string;
  deviceName?: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface WorkorderItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  assignee?: string;
  relatedAlarmIds?: string[];
}

export interface ScheduleItem {
  id: string;
  roomId?: string;
  courseName: string;
  startTime: string;
  endTime: string;
  studentCount?: number;
  weekType: 'normal' | 'exam';
  createdAt: string;
}

export interface AnomalyPoint {
  id: string;
  energyDataId?: string;
  timestamp: string;
  value: number;
  expectedValue?: number;
  deviation?: number;
  severity: 'low' | 'medium' | 'high';
  comment?: string;
  possibleCauses: string[];
  relatedSchedule: ScheduleItem[];
  relatedAlarms: AlarmItem[];
  relatedWorkorders: WorkorderItem[];
  acStrategy?: {
    targetTemp?: number;
    mode?: string;
    fanSpeed?: string;
  };
  createdAt: string;
}

export interface FilterOptions {
  rooms: Room[];
  weekTypes: string[];
  deviceTypes: string[];
}

export interface FilterContext {
  roomIds: string[];
  timeRange: { start: string; end: string };
  timeWindow: 'day' | 'week' | 'month';
  weekType: 'all' | 'exam' | 'normal';
  includeMaintenance: boolean;
  deviceTypes: string[];
}

export interface WeekCompareData {
  exam_week: { time: string; value: number }[];
  normal_week: { time: string; value: number }[];
  exam_total: number;
  normal_total: number;
  difference_percent: number;
}
