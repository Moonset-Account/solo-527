import { delay } from "@/lib/utils";
import {
  mockDashboardStats,
  mockTrendData,
  mockFollowUpCompletion,
  mockMedicalRecords,
  mockPatients,
  mockUsers,
  mockFollowUpTasks,
  mockFollowUpPlans,
  mockChargeItems,
  mockFilterRules,
  mockPermissionExceptions,
  mockAppointments,
  mockAppointmentReports,
} from "@/lib/mock/data";
import type {
  DashboardStats,
  TrendData,
  FollowUpCompletion,
  MedicalRecord,
  FollowUpTask,
  FollowUpPlan,
  ChargeItem,
  FilterRule,
  PermissionException,
  AppointmentReport,
  Patient,
  User,
} from "@/types";

async function mockFetch<T>(data: T): Promise<T> {
  await delay(200 + Math.random() * 200);
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return mockFetch(mockDashboardStats);
}

export async function getTrendData(): Promise<TrendData> {
  return mockFetch(mockTrendData);
}

export async function getFollowUpCompletion(): Promise<FollowUpCompletion> {
  return mockFetch(mockFollowUpCompletion);
}

export interface RecordsFilter {
  department?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  status?: string;
}

export async function getMedicalRecords(
  filter?: RecordsFilter
): Promise<MedicalRecord[]> {
  let records = [...mockMedicalRecords];
  if (filter) {
    if (filter.department)
      records = records.filter((r) => r.department === filter.department);
    if (filter.doctorId)
      records = records.filter((r) => r.doctor_id === filter.doctorId);
    if (filter.startDate)
      records = records.filter((r) => r.visit_date >= filter.startDate!);
    if (filter.endDate)
      records = records.filter((r) => r.visit_date <= filter.endDate!);
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      records = records.filter((r) => {
        const p = mockPatients.find((p) => p.id === r.patient_id);
        return (
          r.chief_complaint.toLowerCase().includes(kw) ||
          (p && p.name.toLowerCase().includes(kw)) ||
          (p && p.patient_no.toLowerCase().includes(kw))
        );
      });
    }
    if (filter.status)
      records = records.filter((r) => r.status === filter.status);
  }
  records = records.map((r) => ({
    ...r,
    patient: mockPatients.find((p) => p.id === r.patient_id),
    doctor: mockUsers.find((u) => u.id === r.doctor_id),
    follow_up_plans: mockFollowUpPlans.filter((p) => p.record_id === r.id),
    charge_items: mockChargeItems.filter((c) => c.record_id === r.id),
  })) as MedicalRecord[];
  return mockFetch(records.sort((a, b) => b.visit_date.localeCompare(a.visit_date)));
}

export async function getMedicalRecordById(
  id: string
): Promise<MedicalRecord | null> {
  const record = mockMedicalRecords.find((r) => r.id === id);
  if (!record) return mockFetch(null);
  const result: MedicalRecord = {
    ...record,
    patient: mockPatients.find((p) => p.id === record.patient_id),
    doctor: mockUsers.find((u) => u.id === record.doctor_id),
    follow_up_plans: mockFollowUpPlans.filter((p) => p.record_id === record.id),
    charge_items: mockChargeItems.filter((c) => c.record_id === record.id),
  };
  return mockFetch(result);
}

export interface TasksFilter {
  status?: string[];
  assignee?: string;
  startDate?: string;
  endDate?: string;
  patientKeyword?: string;
  method?: string;
  minScore?: number;
  maxScore?: number;
}

export async function getFollowUpTasks(
  filter?: TasksFilter
): Promise<FollowUpTask[]> {
  let tasks = [...mockFollowUpTasks];
  if (filter) {
    if (filter.status && filter.status.length > 0)
      tasks = tasks.filter((t) => filter.status!.includes(t.status));
    if (filter.assignee)
      tasks = tasks.filter((t) => t.assigned_to === filter.assignee);
    if (filter.startDate)
      tasks = tasks.filter((t) => t.planned_date >= filter.startDate!);
    if (filter.endDate)
      tasks = tasks.filter((t) => t.planned_date <= filter.endDate!);
    if (filter.method)
      tasks = tasks.filter((t) => t.follow_up_method === filter.method);
    if (filter.minScore !== undefined)
      tasks = tasks.filter(
        (t) => t.quality_score !== null && t.quality_score >= filter.minScore!
      );
    if (filter.maxScore !== undefined)
      tasks = tasks.filter(
        (t) => t.quality_score !== null && t.quality_score <= filter.maxScore!
      );
    if (filter.patientKeyword) {
      const kw = filter.patientKeyword.toLowerCase();
      tasks = tasks.filter((t) => {
        const p = mockPatients.find((p) => p.id === t.patient_id);
        return p && (p.name.toLowerCase().includes(kw) || p.phone.includes(kw));
      });
    }
  }
  tasks = tasks.map((t) => ({
    ...t,
    patient: mockPatients.find((p) => p.id === t.patient_id),
    assignee: t.assigned_to ? mockUsers.find((u) => u.id === t.assigned_to) : undefined,
    record: t.record_id ? mockMedicalRecords.find((r) => r.id === t.record_id) : undefined,
  })) as FollowUpTask[];
  return mockFetch(tasks.sort((a, b) => a.planned_date.localeCompare(b.planned_date)));
}

export async function getFilterRules(
  module: string,
  userId = "u-001"
): Promise<FilterRule[]> {
  return mockFetch(
    mockFilterRules.filter((r) => r.module === module && r.user_id === userId)
  );
}

export async function saveFilterRule(
  rule: Omit<FilterRule, "id" | "created_at">
): Promise<FilterRule> {
  const newRule: FilterRule = {
    ...rule,
    id: `fr-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockFilterRules.push(newRule);
  return mockFetch(newRule);
}

export async function deleteFilterRule(id: string): Promise<void> {
  const idx = mockFilterRules.findIndex((r) => r.id === id);
  if (idx >= 0) mockFilterRules.splice(idx, 1);
  return mockFetch(undefined);
}

export async function getPermissionExceptions(
  status?: string,
  severity?: string
): Promise<PermissionException[]> {
  let list = [...mockPermissionExceptions];
  if (status) list = list.filter((e) => e.status === status);
  if (severity) list = list.filter((e) => e.severity === severity);
  list = list.map((e) => ({
    ...e,
    record: mockMedicalRecords.find((r) => r.id === e.record_id),
    handler: e.handled_by ? mockUsers.find((u) => u.id === e.handled_by) : undefined,
  })) as PermissionException[];
  return mockFetch(list.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function handlePermissionException(
  id: string,
  status: string,
  conclusion: string,
  handlerId = "u-001"
): Promise<PermissionException | null> {
  const item = mockPermissionExceptions.find((e) => e.id === id);
  if (!item) return mockFetch(null);
  item.status = status as PermissionException["status"];
  item.handling_conclusion = conclusion;
  item.handled_by = handlerId;
  const handledAt = new Date().toISOString();
  item.handled_at = handledAt;

  // 模拟 PostgreSQL 触发器：异常处理完成后同步号源利用报表的 exception_impact
  if (status === "resolved" || status === "closed") {
    const record = mockMedicalRecords.find((r) => r.id === item.record_id);
    const reportDate = handledAt.split("T")[0];
    const dept = record?.department || "内科";

    const impact = {
      exception_id: item.id,
      record_id: item.record_id,
      conclusion: conclusion,
      severity: item.severity,
      synced_at: handledAt,
      patient_name: record?.patient_id
        ? mockPatients.find((p) => p.id === record.patient_id)?.name
        : undefined,
    };

    const existingReport = mockAppointmentReports.find(
      (r) => r.report_date === reportDate && r.department === dept
    );
    if (existingReport) {
      existingReport.exception_impact = {
        ...(existingReport.exception_impact || {}),
        ...impact,
      };
    } else {
      mockAppointmentReports.unshift({
        id: `ar-auto-${Date.now()}`,
        report_date: reportDate,
        department: dept,
        total_slots: 0,
        booked_slots: 0,
        attended_slots: 0,
        utilization_rate: "0",
        exception_impact: impact,
        generated_at: handledAt,
      });
    }
  }

  return mockFetch(item);
}

export async function getAppointmentReports(
  startDate?: string,
  endDate?: string
): Promise<AppointmentReport[]> {
  let list = [...mockAppointmentReports];
  if (startDate) list = list.filter((r) => r.report_date >= startDate);
  if (endDate) list = list.filter((r) => r.report_date <= endDate);
  return mockFetch(
    list.sort((a, b) => b.report_date.localeCompare(a.report_date))
  );
}

export async function getPatients(keyword?: string): Promise<Patient[]> {
  let list = [...mockPatients];
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.phone.includes(kw) ||
        p.patient_no.toLowerCase().includes(kw)
    );
  }
  return mockFetch(list);
}

export async function getUsers(role?: string): Promise<User[]> {
  let list = [...mockUsers];
  if (role) list = list.filter((u) => u.role === role);
  return mockFetch(list);
}

export interface RevisitStats {
  date: string;
  totalPatients: number;
  revisitedPatients: number;
  revisitRate: number;
}

export function computeRevisitStats(days = 30): RevisitStats[] {
  const result: RevisitStats[] = [];
  const now = new Date("2026-06-21");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const total = 3 + Math.floor(Math.random() * 6);
    const revisited = Math.floor(total * (0.5 + Math.random() * 0.4));
    result.push({
      date,
      totalPatients: total,
      revisitedPatients: revisited,
      revisitRate: total > 0 ? revisited / total : 0,
    });
  }
  return result;
}

export interface ChurnItem {
  id: string;
  name: string;
  patientNo: string;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  reason: string;
  phone: string;
}

export function getChurnedPatients(): ChurnItem[] {
  return [
    { id: "p-005", name: "吴志强", patientNo: "P26060005", lastVisitDate: daysAgo(10), daysSinceLastVisit: 10, reason: "未按时复诊，电话未接", phone: "135****7890" },
    { id: "p-011", name: "蒋文博", patientNo: "P26060011", lastVisitDate: daysAgo(6), daysSinceLastVisit: 6, reason: "血压随访逾期", phone: "159****1111" },
    { id: "p-001", name: "赵建国", patientNo: "P26060001", lastVisitDate: daysAgo(20), daysSinceLastVisit: 20, reason: "建议三诊未到", phone: "138****1234" },
  ];
}

function daysAgo(d: number): string {
  const date = new Date("2026-06-21");
  date.setDate(date.getDate() - d);
  return date.toISOString().split("T")[0];
}
