export type PrescriptionType = 'emergency' | 'normal' | 'specialist';

export type ProcessNodeType = 'create' | 'pay' | 'dispense' | 'call' | 'pick' | 'refund';

export type TimePeriod = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface Window {
  id: string;
  windowNo: string;
  windowName: string;
  area: 'outpatient' | 'emergency' | 'inpatient';
  capacity: number;
  isActive: boolean;
}

export interface Pharmacist {
  id: string;
  name: string;
  title: string;
  specialty: string;
  windowId: string;
}

export interface Department {
  id: string;
  deptName: string;
  deptCategory: 'outpatient' | 'emergency' | 'inpatient';
  dailyPrescriptionAvg: number;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  type: PrescriptionType;
  departmentId: string;
  departmentName: string;
  windowId: string;
  windowNo: string;
  pharmacistId: string;
  pharmacistName: string;
  createdAt: string;
  paidAt: string;
  dispensedAt: string;
  calledAt: string;
  pickedAt: string;
  refundedAt?: string;
  amount: number;
  drugCount: number;
  patientCategory: string;
  waitTime: number;
  dispenseTime: number;
  timePeriod: TimePeriod;
  hour: number;
}

export interface ProcessNode {
  id: string;
  prescriptionId: string;
  nodeType: ProcessNodeType;
  occurredAt: string;
  durationSeconds: number;
  operator: string;
}

export interface KPIData {
  totalPrescriptions: number;
  emergencyPrescriptions: number;
  normalPrescriptions: number;
  specialistPrescriptions: number;
  avgWaitTime: number;
  avgWaitTimeEmergency: number;
  avgWaitTimeNormal: number;
  avgWaitTimeSpecialist: number;
  avgDispenseTime: number;
  refundRate: number;
  windowUtilization: Record<string, number>;
  peakHour: number;
}

export type RemarkTargetType = 'prescription' | 'window' | 'period' | 'metric';

export interface Remark {
  id: string;
  targetType: RemarkTargetType;
  targetValue: string;
  content: string;
  author: string;
  createdAt: string;
  severity: 'normal' | 'warning' | 'critical';
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  windows: string[];
  pharmacists: string[];
  departments: string[];
  prescriptionTypes: PrescriptionType[];
  timePeriods: TimePeriod[];
}

export interface WaitDistributionItem {
  range: string;
  count: number;
  emergencyCount: number;
  normalCount: number;
}

export interface WindowCompareItem {
  windowNo: string;
  totalPrescriptions: number;
  avgWaitTime: number;
  avgDispenseTime: number;
  utilization: number;
}

export interface HourlyPrescriptionItem {
  hour: string;
  emergency: number;
  normal: number;
  specialist: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  avgDuration: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
