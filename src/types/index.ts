export interface User {
  id: string;
  username: string;
  realNameMasked: string | null;
  roleId: string;
  role?: UserRole;
  departmentScopes: string[];
  createdAt: string;
  lastLogin: string | null;
}

export interface UserRole {
  id: string;
  roleName: string;
  permissions: Record<string, any>;
}

export interface Department {
  id: string;
  deptCode: string;
  deptName: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  floorNumber?: number | null;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  doctorCode: string;
  doctorNameMasked: string;
  deptId: string;
  department?: Department;
  title?: string | null;
  isActive: boolean;
}

export interface PatientType {
  id: string;
  typeCode: string;
  typeName: string;
  description?: string | null;
  isActive: boolean;
}

export interface VisitProcess {
  id: string;
  visitNumberMasked: string;
  patientTypeId: string | null;
  patientType?: PatientType;
  deptId: string;
  department?: Department;
  doctorId: string | null;
  doctor?: Doctor;
  registerTime: string | null;
  checkinTime: string | null;
  triageTime: string | null;
  callTime: string | null;
  paymentTime: string | null;
  medicineTime: string | null;
  waitTotalMinutes: number | null;
  waitRegisterMinutes: number | null;
  waitTriageMinutes: number | null;
  waitDoctorMinutes: number | null;
  waitPaymentMinutes: number | null;
  waitMedicineMinutes: number | null;
  visitDate: string;
  hourOfDay: number | null;
  dayOfWeek: number | null;
  importId: string | null;
  annotations?: Annotation[];
}

export interface Annotation {
  id: string;
  userId: string;
  user?: User;
  visitId: string | null;
  visit?: VisitProcess;
  annotationType: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ImportLog {
  id: string;
  userId: string;
  user?: User;
  fileName: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errorDetails?: Record<string, any> | null;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

export interface FilterState {
  dateRange: [string, string] | null;
  departments: string[];
  doctors: string[];
  patientTypes: string[];
  timeSlots: string[];
  processNodes: string[];
  hourRange: [number, number];
}

export interface KPIMetrics {
  avgWaitTotal: number;
  avgWaitRegister: number;
  avgWaitTriage: number;
  avgWaitDoctor: number;
  avgWaitPayment: number;
  avgWaitMedicine: number;
  maxWaitTotal: number;
  totalVisits: number;
  bottleneckNode: string;
  avgWaitTrend: number;
}

export interface SankeyNode {
  name: string;
  value?: number;
  itemStyle?: {
    color: string;
  };
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  waitTime: number;
  lineStyle?: {
    color: string;
    opacity: number;
  };
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface WaitDistributionItem {
  bucket: string;
  min: number;
  max: number;
  count: number;
}

export interface DepartmentComparisonItem {
  deptId: string;
  deptName: string;
  avgWaitTotal: number;
  avgWaitDoctor: number;
  totalVisits: number;
  rank: number;
}

export interface TrendItem {
  date: string;
  hour?: number;
  dayOfWeek?: number;
  avgWaitTotal: number;
  totalVisits: number;
  annotation?: Annotation;
}

export interface HeatmapItem {
  hour: number;
  dayOfWeek: number;
  value: number;
}

export interface TimeSlot {
  code: string;
  name: string;
  startHour: number;
  endHour: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { code: "morning", name: "上午", startHour: 6, endHour: 12 },
  { code: "noon", name: "午间", startHour: 12, endHour: 14 },
  { code: "afternoon", name: "下午", startHour: 14, endHour: 18 },
  { code: "evening", name: "晚间", startHour: 18, endHour: 24 },
  { code: "night", name: "凌晨", startHour: 0, endHour: 6 },
];

export const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export const PROCESS_NODES = [
  { key: "register", name: "挂号", color: "#165DFF" },
  { key: "checkin", name: "签到", color: "#00B42A" },
  { key: "triage", name: "分诊", color: "#FF7D00" },
  { key: "call", name: "叫号就诊", color: "#F53F3F" },
  { key: "payment", name: "缴费", color: "#722ED1" },
  { key: "medicine", name: "取药", color: "#14C9C9" },
];

export const ANNOTATION_TYPES = [
  { value: "system_abnormal", label: "系统异常" },
  { value: "staff_shortage", label: "人员不足" },
  { value: "equipment_failure", label: "设备故障" },
  { value: "special_event", label: "特殊事件" },
  { value: "data_issue", label: "数据问题" },
  { value: "other", label: "其他" },
];
