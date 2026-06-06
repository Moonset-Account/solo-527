import {
  Department,
  Doctor,
  PatientType,
  VisitProcess,
  Annotation,
  KPIMetrics,
  SankeyData,
  WaitDistributionItem,
  DepartmentComparisonItem,
  TrendItem,
  HeatmapItem,
  FilterState,
  PROCESS_NODES,
  WEEK_DAYS,
} from "@/types";
import { generateId, getTimeSlot, percentile, groupBy } from "@/utils";
import { addDays, setHours, setMinutes, addMinutes, format } from "date-fns";

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "dept-001",
    deptCode: "INTERNAL",
    deptName: "内科",
    location: { type: "Point", coordinates: [116.4074, 39.9042] },
    floorNumber: 2,
    isActive: true,
  },
  {
    id: "dept-002",
    deptCode: "SURGERY",
    deptName: "外科",
    location: { type: "Point", coordinates: [116.4075, 39.9043] },
    floorNumber: 3,
    isActive: true,
  },
  {
    id: "dept-003",
    deptCode: "PEDIATRICS",
    deptName: "儿科",
    location: { type: "Point", coordinates: [116.4073, 39.9041] },
    floorNumber: 1,
    isActive: true,
  },
  {
    id: "dept-004",
    deptCode: "OBGYN",
    deptName: "妇产科",
    location: { type: "Point", coordinates: [116.4072, 39.9044] },
    floorNumber: 4,
    isActive: true,
  },
  {
    id: "dept-005",
    deptCode: "CARDIOLOGY",
    deptName: "心内科",
    location: { type: "Point", coordinates: [116.4076, 39.9042] },
    floorNumber: 5,
    isActive: true,
  },
  {
    id: "dept-006",
    deptCode: "NEUROLOGY",
    deptName: "神经内科",
    location: { type: "Point", coordinates: [116.4071, 39.9043] },
    floorNumber: 5,
    isActive: true,
  },
  {
    id: "dept-007",
    deptCode: "ORTHOPEDICS",
    deptName: "骨科",
    location: { type: "Point", coordinates: [116.4074, 39.9045] },
    floorNumber: 3,
    isActive: true,
  },
  {
    id: "dept-008",
    deptCode: "OPHTHALMOLOGY",
    deptName: "眼科",
    location: { type: "Point", coordinates: [116.4075, 39.904] },
    floorNumber: 2,
    isActive: true,
  },
];

export const MOCK_DOCTORS: Doctor[] = MOCK_DEPARTMENTS.flatMap((dept) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `doc-${dept.id}-${i + 1}`,
    doctorCode: `DOC${dept.deptCode}${i + 1}`,
    doctorNameMasked: ["张医生", "李医生", "王医生", "刘医生", "陈医生"][i % 5],
    deptId: dept.id,
    title: ["主任医师", "副主任医师", "主治医师"][i % 3],
    isActive: true,
  }))
);

export const MOCK_PATIENT_TYPES: PatientType[] = [
  { id: "pt-001", typeCode: "normal", typeName: "普通门诊", isActive: true },
  { id: "pt-002", typeCode: "emergency", typeName: "急诊", isActive: true },
  { id: "pt-003", typeCode: "followup", typeName: "复诊", isActive: true },
  { id: "pt-004", typeCode: "vip", typeName: "特需门诊", isActive: true },
];

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function generateMockVisits(days: number = 30): VisitProcess[] {
  const visits: VisitProcess[] = [];
  const endDate = new Date();
  const startDate = addDays(endDate, -days);

  for (let d = 0; d < days; d++) {
    const currentDate = addDays(startDate, d);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyVisits = isWeekend ? randomInRange(80, 150) : randomInRange(150, 280);

    for (let v = 0; v < dailyVisits; v++) {
      const dept = weightedRandom(MOCK_DEPARTMENTS, [25, 20, 15, 12, 10, 8, 7, 3]);
      const doctor = MOCK_DOCTORS.filter((d) => d.deptId === dept.id)[
        randomInRange(0, 2)
      ];
      const patientType = weightedRandom(MOCK_PATIENT_TYPES, [55, 15, 20, 10]);

      const baseHour = weightedRandom(
        [8, 9, 10, 11, 13, 14, 15, 16, 17, 19],
        [10, 20, 25, 20, 15, 20, 22, 18, 12, 8]
      );
      const baseMinute = randomInRange(0, 59);

      let registerTime = setMinutes(setHours(currentDate, baseHour), baseMinute);

      const deptWaitMultiplier = {
        "dept-001": 1.2,
        "dept-002": 1.0,
        "dept-003": 1.5,
        "dept-004": 1.1,
        "dept-005": 1.4,
        "dept-006": 1.3,
        "dept-007": 1.0,
        "dept-008": 0.9,
      }[dept.id] || 1.0;

      const typeWaitMultiplier = {
        "pt-001": 1.0,
        "pt-002": 0.3,
        "pt-003": 0.7,
        "pt-004": 0.4,
      }[patientType.id] || 1.0;

      const isPeak = (baseHour >= 9 && baseHour <= 11) || (baseHour >= 14 && baseHour <= 16);
      const peakMultiplier = isPeak ? 1.5 : 1.0;

      const waitRegister = randomInRange(1, 5) * deptWaitMultiplier * typeWaitMultiplier;
      const waitTriage = randomInRange(5, 20) * deptWaitMultiplier * typeWaitMultiplier * peakMultiplier;
      const waitDoctor = randomInRange(10, 45) * deptWaitMultiplier * typeWaitMultiplier * peakMultiplier;
      const waitPayment = randomInRange(2, 10) * peakMultiplier;
      const waitMedicine = randomInRange(5, 20) * peakMultiplier;

      const checkinTime = addMinutes(registerTime, Math.floor(waitRegister));
      const triageTime = addMinutes(checkinTime, Math.floor(waitTriage));
      const callTime = addMinutes(triageTime, Math.floor(waitDoctor));
      const paymentTime = addMinutes(callTime, randomInRange(5, 20));
      const medicineTime = addMinutes(paymentTime, Math.floor(waitMedicine));

      const waitTotal =
        Math.floor(waitRegister) +
        Math.floor(waitTriage) +
        Math.floor(waitDoctor) +
        Math.floor(waitPayment) +
        Math.floor(waitMedicine);

      const hourOfDay = registerTime.getHours();

      visits.push({
        id: generateId(),
        visitNumberMasked: `VISIT${format(currentDate, "yyyyMMdd")}${String(v + 1).padStart(4, "0")}`,
        patientTypeId: patientType.id,
        patientType,
        deptId: dept.id,
        department: dept,
        doctorId: doctor?.id,
        doctor,
        registerTime: registerTime.toISOString(),
        checkinTime: checkinTime.toISOString(),
        triageTime: triageTime.toISOString(),
        callTime: callTime.toISOString(),
        paymentTime: paymentTime.toISOString(),
        medicineTime: medicineTime.toISOString(),
        waitTotalMinutes: waitTotal,
        waitRegisterMinutes: Math.floor(waitRegister),
        waitTriageMinutes: Math.floor(waitTriage),
        waitDoctorMinutes: Math.floor(waitDoctor),
        waitPaymentMinutes: Math.floor(waitPayment),
        waitMedicineMinutes: Math.floor(waitMedicine),
        visitDate: format(currentDate, "yyyy-MM-dd"),
        hourOfDay,
        dayOfWeek,
        importId: null,
      });
    }
  }

  return visits;
}

export const MOCK_VISITS = generateMockVisits(30);

export const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: "ann-001",
    userId: "user-001",
    visitId: null,
    annotationType: "special_event",
    description: "周一早上系统升级，导致挂号等待时间延长",
    metadata: { date: "2026-06-02", affectedHours: [8, 9, 10] },
    createdAt: "2026-06-02T10:30:00.000Z",
    updatedAt: "2026-06-02T10:30:00.000Z",
  },
  {
    id: "ann-002",
    userId: "user-001",
    visitId: null,
    annotationType: "staff_shortage",
    description: "儿科医生临时请假，当天叫号等待时间较长",
    metadata: { date: "2026-06-05", deptId: "dept-003" },
    createdAt: "2026-06-05T16:00:00.000Z",
    updatedAt: "2026-06-05T16:00:00.000Z",
  },
];

export function filterVisits(
  visits: VisitProcess[],
  filters: Partial<FilterState>
): VisitProcess[] {
  return visits.filter((visit) => {
    if (filters.departments?.length && !filters.departments.includes(visit.deptId)) {
      return false;
    }
    if (filters.doctors?.length && visit.doctorId && !filters.doctors.includes(visit.doctorId)) {
      return false;
    }
    if (filters.patientTypes?.length && visit.patientTypeId && !filters.patientTypes.includes(visit.patientTypeId)) {
      return false;
    }
    if (filters.timeSlots?.length && visit.hourOfDay !== null) {
      const slot = getTimeSlot(visit.hourOfDay);
      if (!filters.timeSlots.includes(slot)) return false;
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      if (visit.visitDate < start || visit.visitDate > end) return false;
    }
    if (filters.processNodes?.length) {
      const nodeFieldMap: Record<string, keyof VisitProcess> = {
        register: "registerTime",
        checkin: "checkinTime",
        triage: "triageTime",
        call: "callTime",
        payment: "paymentTime",
        medicine: "medicineTime",
      };
      const hasAllNodes = filters.processNodes.every((node) => {
        const field = nodeFieldMap[node];
        return field && visit[field] !== null;
      });
      if (!hasAllNodes) return false;
    }
    return true;
  });
}

export function calculateKPIMetrics(visits: VisitProcess[]): KPIMetrics {
  const validVisits = visits.filter((v) => v.waitTotalMinutes !== null);
  const total = validVisits.length;

  if (total === 0) {
    return {
      avgWaitTotal: 0,
      avgWaitRegister: 0,
      avgWaitTriage: 0,
      avgWaitDoctor: 0,
      avgWaitPayment: 0,
      avgWaitMedicine: 0,
      maxWaitTotal: 0,
      totalVisits: visits.length,
      bottleneckNode: "-",
      avgWaitTrend: 0,
    };
  }

  const sum = (key: keyof VisitProcess) =>
    validVisits.reduce((acc, v) => acc + ((v[key] as number) || 0), 0);

  const nodeWaits = [
    { key: "waitTriageMinutes", name: "分诊等待" },
    { key: "waitDoctorMinutes", name: "就诊等待" },
    { key: "waitPaymentMinutes", name: "缴费等待" },
    { key: "waitMedicineMinutes", name: "取药等待" },
  ];

  const avgNodeWaits = nodeWaits.map((n) => ({
    ...n,
    avg: sum(n.key as keyof VisitProcess) / total,
  }));
  const bottleneck = avgNodeWaits.reduce((max, curr) =>
    curr.avg > max.avg ? curr : max
  );

  const maxWait = Math.max(...validVisits.map((v) => v.waitTotalMinutes || 0));

  const midPoint = Math.floor(total / 2);
  const firstHalf = validVisits.slice(0, midPoint);
  const secondHalf = validVisits.slice(midPoint);
  const avgFirst = firstHalf.reduce((a, v) => a + (v.waitTotalMinutes || 0), 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((a, v) => a + (v.waitTotalMinutes || 0), 0) / (secondHalf.length || 1);
  const trend = avgSecond - avgFirst;

  return {
    avgWaitTotal: Math.round(sum("waitTotalMinutes") / total),
    avgWaitRegister: Math.round(sum("waitRegisterMinutes") / total),
    avgWaitTriage: Math.round(sum("waitTriageMinutes") / total),
    avgWaitDoctor: Math.round(sum("waitDoctorMinutes") / total),
    avgWaitPayment: Math.round(sum("waitPaymentMinutes") / total),
    avgWaitMedicine: Math.round(sum("waitMedicineMinutes") / total),
    maxWaitTotal: maxWait,
    totalVisits: visits.length,
    bottleneckNode: bottleneck.name,
    avgWaitTrend: Math.round(trend),
  };
}

export function generateSankeyData(visits: VisitProcess[]): SankeyData {
  const nodes = PROCESS_NODES.map((n) => ({
    name: n.name,
    itemStyle: { color: n.color },
  }));

  const linkWaitMapping: Array<{
    source: string;
    target: string;
    waitField: keyof VisitProcess;
  }> = [
    { source: "挂号", target: "签到", waitField: "waitRegisterMinutes" },
    { source: "签到", target: "分诊", waitField: "waitTriageMinutes" },
    { source: "分诊", target: "叫号就诊", waitField: "waitDoctorMinutes" },
    { source: "叫号就诊", target: "缴费", waitField: "waitPaymentMinutes" },
    { source: "缴费", target: "取药", waitField: "waitMedicineMinutes" },
  ];

  const links: SankeyData["links"] = linkWaitMapping.map((mapping) => {
    const validWaits = visits
      .map((v) => v[mapping.waitField] as number | null)
      .filter((w): w is number => w !== null && typeof w === "number" && w >= 0);
    
    const totalWait = validWaits.reduce((acc, w) => acc + w, 0);
    const avgWait = validWaits.length > 0 ? Math.round(totalWait / validWaits.length) : 0;

    return {
      source: mapping.source,
      target: mapping.target,
      value: validWaits.length,
      waitTime: avgWait,
    };
  });

  return { nodes, links };
}

export function generateWaitDistribution(visits: VisitProcess[]): WaitDistributionItem[] {
  const waits = visits
    .map((v) => v.waitTotalMinutes as number | null)
    .filter((w): w is number => w !== null && typeof w === "number" && w >= 0);

  if (waits.length === 0) return [];

  const buckets = [
    { bucket: "0-10分钟", min: 0, max: 10 },
    { bucket: "10-20分钟", min: 10, max: 20 },
    { bucket: "20-30分钟", min: 20, max: 30 },
    { bucket: "30-45分钟", min: 30, max: 45 },
    { bucket: "45-60分钟", min: 45, max: 60 },
    { bucket: "60分钟以上", min: 60, max: Infinity },
  ];

  return buckets.map((b) => ({
    ...b,
    count: waits.filter((w) => w >= b.min && w < b.max).length,
  }));
}

export function generateDepartmentComparison(visits: VisitProcess[]): DepartmentComparisonItem[] {
  const grouped = groupBy(visits, (v) => v.deptId);

  const comparison = Object.entries(grouped).map(([deptId, deptVisits]) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === deptId);
    const validWaits = deptVisits
      .map((v) => v.waitTotalMinutes)
      .filter((w): w is number => w !== null);
    const validDoctorWaits = deptVisits
      .map((v) => v.waitDoctorMinutes)
      .filter((w): w is number => w !== null);

    return {
      deptId,
      deptName: dept?.deptName || "未知科室",
      avgWaitTotal: validWaits.length > 0
        ? Math.round(validWaits.reduce((a, b) => a + b, 0) / validWaits.length)
        : 0,
      avgWaitDoctor: validDoctorWaits.length > 0
        ? Math.round(validDoctorWaits.reduce((a, b) => a + b, 0) / validDoctorWaits.length)
        : 0,
      totalVisits: deptVisits.length,
      rank: 0,
    };
  });

  comparison.sort((a, b) => b.avgWaitTotal - a.avgWaitTotal);
  comparison.forEach((item, index) => {
    item.rank = index + 1;
  });

  return comparison;
}

export function generateTrendData(visits: VisitProcess[]): TrendItem[] {
  const grouped = groupBy(visits, (v) => v.visitDate);

  return Object.entries(grouped)
    .map(([date, dayVisits]) => {
      const validWaits = dayVisits
        .map((v) => v.waitTotalMinutes)
        .filter((w): w is number => w !== null);

      return {
        date,
        avgWaitTotal: validWaits.length > 0
          ? Math.round(validWaits.reduce((a, b) => a + b, 0) / validWaits.length)
          : 0,
        totalVisits: dayVisits.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function generateHeatmapData(visits: VisitProcess[]): HeatmapItem[] {
  const data: HeatmapItem[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const hourVisits = visits.filter(
        (v) => v.dayOfWeek === day && v.hourOfDay === hour
      );
      const validWaits = hourVisits
        .map((v) => v.waitTotalMinutes)
        .filter((w): w is number => w !== null);

      data.push({
        hour,
        dayOfWeek: day,
        value: validWaits.length > 0
          ? Math.round(validWaits.reduce((a, b) => a + b, 0) / validWaits.length)
          : 0,
      });
    }
  }

  return data;
}
