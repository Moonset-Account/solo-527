import { create } from "zustand";
import type {
  ClassSchedule,
  ConsumptionRecord,
  DashboardOverview,
  InsufficientAlert,
  Notice,
  NoticeReceipt,
  QuestionBankVersion,
} from "@/shared/types";

interface AppState {
  overview: DashboardOverview;
  todaySchedules: ClassSchedule[];
  insufficientAlerts: InsufficientAlert[];
  activeScheduleId: string | null;
  showConsumptionPanel: boolean;
  selectedStudentIds: Set<string>;
  noticeList: Notice[];
  noticeReceiptsMap: Record<string, NoticeReceipt[]>;
  questionBankVersions: QuestionBankVersion[];
  lastConsumedRecordIds: string[];
  openSchedule: (id: string) => void;
  closeConsumptionPanel: () => void;
  toggleStudent: (sid: string) => void;
  selectAllStudents: (sids: string[]) => void;
  clearStudents: () => void;
  setOverview: (o: Partial<DashboardOverview>) => void;
  setSchedules: (s: ClassSchedule[]) => void;
  setAlerts: (a: InsufficientAlert[]) => void;
  markConsumed: (ids: string[]) => void;
  setNotices: (n: Notice[]) => void;
  setReceipts: (noticeId: string, r: NoticeReceipt[]) => void;
  setQBVersions: (v: QuestionBankVersion[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  overview: {
    pendingConsumptionCount: 0,
    insufficientAlertCount: 0,
    pendingReceiptCount: 0,
    todayConsumedHours: 0,
  },
  todaySchedules: [],
  insufficientAlerts: [],
  activeScheduleId: null,
  showConsumptionPanel: false,
  selectedStudentIds: new Set(),
  noticeList: [],
  noticeReceiptsMap: {},
  questionBankVersions: [],
  lastConsumedRecordIds: [],

  openSchedule: (id) =>
    set({ activeScheduleId: id, showConsumptionPanel: true, selectedStudentIds: new Set() }),
  closeConsumptionPanel: () =>
    set({ showConsumptionPanel: false, activeScheduleId: null, selectedStudentIds: new Set() }),
  toggleStudent: (sid) => {
    const s = new Set(get().selectedStudentIds);
    if (s.has(sid)) s.delete(sid);
    else s.add(sid);
    set({ selectedStudentIds: s });
  },
  selectAllStudents: (sids) => set({ selectedStudentIds: new Set(sids) }),
  clearStudents: () => set({ selectedStudentIds: new Set() }),
  setOverview: (o) => set((s) => ({ overview: { ...s.overview, ...o } })),
  setSchedules: (s) => set({ todaySchedules: s }),
  setAlerts: (a) => set({ insufficientAlerts: a }),
  markConsumed: (ids) => set({ lastConsumedRecordIds: ids }),
  setNotices: (n) => set({ noticeList: n }),
  setReceipts: (nid, r) =>
    set((s) => ({ noticeReceiptsMap: { ...s.noticeReceiptsMap, [nid]: r } })),
  setQBVersions: (v) => set({ questionBankVersions: v }),
}));
