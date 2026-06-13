import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  MessageSquare,
  Minus,
  Phone,
  Plus,
  Sparkles,
  Target,
  X,
  Zap,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  History,
  UserCheck,
} from "lucide-react";
import {
  createConsumption,
  getDashboardOverview,
  getInsufficientAlerts,
  getTodaySchedules,
} from "@/server/services/consumptionService";
import { getActiveVersions } from "@/server/services/questionBankService";
import { getFeedbacks } from "@/server/services/reportService";
import { formatDate, hoursShortageColor, cn } from "@/shared/utils";
import type {
  ClassSchedule,
  CreateConsumptionResponse,
  DashboardOverview,
  Feedback,
  InsufficientAlert,
  QuestionBankVersion,
  User,
} from "@/shared/types";
import { useAppStore } from "@/store/useAppStore";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  const today = formatDate(new Date());
  const [overview, schedules, alerts, versions, feedbacks] = await Promise.all([
    getDashboardOverview(user),
    getTodaySchedules(),
    getInsufficientAlerts(),
    getActiveVersions(),
    getFeedbacks({ startDate: today, endDate: today }),
  ]).catch((e) => {
    console.warn("[Dashboard loader fallback]", e.message);
    return [
      { pendingConsumptionCount: 0, insufficientAlertCount: 0, pendingReceiptCount: 0, todayConsumedHours: 0 } as DashboardOverview,
      [],
      [],
      [],
      [],
    ] as const;
  });
  return json({ user, overview, schedules, alerts, versions, feedbacks, today });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = (context as any).user as User | null;
  const ip = (context as any).ip as string;
  if (!user) return redirect("/login");
  try {
    const body = await request.json().catch(async () => {
      const fd = await request.formData();
      return Object.fromEntries(fd.entries());
    });
    const scheduleId = body.scheduleId;
    const items = Array.isArray(body.items) ? body.items : JSON.parse(String(body.items || "[]"));
    const questionBankVersionId = body.questionBankVersionId;
    const remark = body.remark ? String(body.remark) : undefined;
    if (!scheduleId || !items.length || !questionBankVersionId) {
      return json({ success: false, error: "参数不完整" }, { status: 400 });
    }
    const result = await createConsumption(user, { scheduleId, items, questionBankVersionId, remark }, ip);
    return json(result);
  } catch (e: any) {
    return json({ success: false, error: e.message || "提交失败" }, { status: 500 });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const {
    todaySchedules,
    setSchedules,
    activeScheduleId,
    showConsumptionPanel,
    openSchedule,
    closeConsumptionPanel,
    selectedStudentIds,
    toggleStudent,
    selectAllStudents,
    clearStudents,
    setAlerts,
    insufficientAlerts,
    setQBVersions,
    markConsumed,
    lastConsumedRecordIds,
  } = useAppStore();

  const [remark, setRemark] = useState("");
  const [versionId, setVersionId] = useState("");
  const [hoursPerStudent, setHoursPerStudent] = useState(2);
  const [toast, setToast] = useState<{ text: string; sub?: string; type: "success" | "warn" } | null>(null);
  const consumeFetcher = useFetcher<CreateConsumptionResponse & { error?: string }>();
  const fetcherResult = consumeFetcher.data;

  useEffect(() => {
    setSchedules(data.schedules);
    setAlerts(data.alerts);
    setQBVersions(data.versions);
  }, [data, setSchedules, setAlerts, setQBVersions]);

  useEffect(() => {
    if (fetcherResult?.success) {
      const totalHours = fetcherResult.records.reduce((s, r) => s + r.hours, 0);
      setToast({
        text: `已成功消课 ${fetcherResult.records.length} 人 · 共 ${totalHours}h`,
        sub: "操作留痕已记录 · 数据已同步课时统计报表",
        type: "success",
      });
      markConsumed(fetcherResult.records.map((r) => r.id));
      if (fetcherResult.insufficientAlerts.length) {
        setTimeout(
          () =>
            setToast({
              text: `${fetcherResult.insufficientAlerts.length} 位学员课时不足`,
              sub: "请联系家长续报，已加入预警列表",
              type: "warn",
            }),
          2200
        );
      }
      setTimeout(() => setToast(null), 5000);
      closeConsumptionPanel();
    } else if (fetcherResult?.error) {
      setToast({ text: fetcherResult.error, type: "warn" });
      setTimeout(() => setToast(null), 3000);
    }
  }, [fetcherResult, markConsumed, closeConsumptionPanel]);

  const activeSchedule = todaySchedules.find((s) => s.id === activeScheduleId);
  const versionOptions = data.versions;

  useEffect(() => {
    if (activeSchedule && !versionId) {
      setVersionId(activeSchedule.questionBankVersionId || versionOptions[0]?.id || "");
    }
    if (!activeSchedule) {
      setVersionId("");
      clearStudents();
      setRemark("");
    }
  }, [activeScheduleId, activeSchedule, versionOptions, versionId, clearStudents]);

  const submitConsumption = () => {
    if (!activeSchedule || selectedStudentIds.size === 0 || !versionId) return;
    const items = [...selectedStudentIds].map((sid) => ({ studentId: sid, hours: hoursPerStudent }));
    consumeFetcher.submit(
      { scheduleId: activeSchedule.id, items: JSON.stringify(items), questionBankVersionId: versionId, remark },
      { method: "POST", encType: "application/json" as any }
    );
  };

  const pendingCount = todaySchedules.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <OverviewCards overview={data.overview} pendingCount={pendingCount} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6 min-w-0">
          <ScheduleConsumptionZone
            schedules={todaySchedules}
            versions={versionOptions}
            activeSchedule={activeSchedule}
            onOpen={(s) => {
              openSchedule(s.id);
              const sched = todaySchedules.find((x) => x.id === s.id);
              if (sched) selectAllStudents(sched.studentIds.slice(0, 5));
            }}
            onClose={closeConsumptionPanel}
            selectedIds={selectedStudentIds}
            onToggle={toggleStudent}
            onSelectAll={(ids) => selectAllStudents(ids)}
            onClear={clearStudents}
            versionId={versionId}
            setVersionId={setVersionId}
            hoursPerStudent={hoursPerStudent}
            setHoursPerStudent={setHoursPerStudent}
            remark={remark}
            setRemark={setRemark}
            onSubmit={submitConsumption}
            submitting={consumeFetcher.state !== "idle"}
            lastConsumedIds={lastConsumedRecordIds}
            today={data.today}
          />

          <TodayFeedbackCard feedbacks={data.feedbacks} />
        </div>

        <div className="space-y-6">
          <HoursAlertPanel alerts={insufficientAlerts.length ? insufficientAlerts : data.alerts} />
          <QuickStatsSide overview={data.overview} />
        </div>
      </div>

      {toast && (
        <div
          className={cn(
            "fixed top-5 right-5 z-[60] animate-slide-in-right rounded-lg2 px-4 py-3 border shadow-lg flex items-start gap-2.5 text-sm font-medium min-w-[260px]",
            toast.type === "success" ? "bg-mint-500 border-mint-400 text-white" : "bg-amber-500 border-amber-400 text-white"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div>{toast.text}</div>
            {toast.sub && (
              <div className="text-[11px] opacity-85 mt-0.5 leading-snug">{toast.sub}</div>
            )}
          </div>
        </div>
      )}

      <GlobalAlertDrawer alerts={insufficientAlerts} />
    </div>
  );
}

function OverviewCards({ overview, pendingCount }: { overview: DashboardOverview; pendingCount: number }) {
  const cards = [
    {
      label: "今日待消课",
      value: pendingCount,
      unit: "个课次",
      icon: Target,
      bg: "bg-slate-800",
      border: "border-slate-900",
      text: "text-white",
      sub: "点下方卡片快速录入",
    },
    {
      label: "课时预警学员",
      value: overview.insufficientAlertCount,
      unit: "人",
      icon: AlertTriangle,
      bg: "bg-amber-500",
      border: "border-amber-500/60",
      text: "text-white",
      sub: "剩余课时 ≤ 阈值",
      breathe: true,
    },
    {
      label: "待审核回执",
      value: overview.pendingReceiptCount + 2,
      unit: "份",
      icon: FileCheck2,
      bg: "bg-white",
      border: "border-slate-200",
      text: "text-slate-800",
      sub: "通知后台查看详情",
    },
    {
      label: "今日已消课时",
      value: overview.todayConsumedHours,
      unit: "h",
      icon: Zap,
      bg: "bg-white",
      border: "border-slate-200",
      text: "text-slate-800",
      sub: "自动同步报表",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={cn(
            "relative p-4 xl:p-5 rounded-lg2 border shadow-card overflow-hidden",
            c.bg,
            c.border
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className={cn("text-xs font-medium opacity-80", c.text)}>{c.label}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={cn("text-3xl font-black font-nums tracking-tight", c.text)}>
                  {c.value}
                </span>
                <span className={cn("text-xs font-medium opacity-70", c.text)}>{c.unit}</span>
              </div>
              <div className={cn("mt-1.5 text-[11px] opacity-65", c.text)}>{c.sub}</div>
            </div>
            <c.icon
              className={cn(
                "w-5 h-5 opacity-70",
                c.text,
                c.breathe ? "animate-breathe" : ""
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleConsumptionZone({
  schedules,
  versions,
  activeSchedule,
  onOpen,
  onClose,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  versionId,
  setVersionId,
  hoursPerStudent,
  setHoursPerStudent,
  remark,
  setRemark,
  onSubmit,
  submitting,
  lastConsumedIds,
  today,
}: {
  schedules: ClassSchedule[];
  versions: QuestionBankVersion[];
  activeSchedule?: ClassSchedule;
  onOpen: (s: ClassSchedule) => void;
  onClose: () => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClear: () => void;
  versionId: string;
  setVersionId: (v: string) => void;
  hoursPerStudent: number;
  setHoursPerStudent: (n: number) => void;
  remark: string;
  setRemark: (s: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  lastConsumedIds: string[];
  today: string;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">今日课表 · 消课录入</div>
            <div className="text-[11px] text-slate-500">{today} · 左侧选择课次，右侧同区完成录入</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="kbd">N</span>
          <span>快速消课</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] min-h-[520px]">
        <div className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60 overflow-y-auto max-h-[60vh] lg:max-h-none">
          {schedules.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-sm text-slate-500">今日暂无排课</div>
              <div className="text-[11px] text-slate-400 mt-1">可前往「班级课表」添加</div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {schedules.map((s) => {
                const active = s.id === activeSchedule?.id;
                const completed = s.status === "completed";
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "px-4 py-3.5 cursor-pointer transition-all",
                      active && !completed && "bg-white shadow-sm relative",
                      !active && !completed && "hover:bg-white/70",
                      completed && "opacity-60 cursor-default bg-mint-50/50"
                    )}
                    onClick={() => !completed && onOpen(s)}
                  >
                    {active && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {s.startTime}-{s.endTime}
                        </span>
                      </div>
                      {completed ? (
                        <span className="chip-green">已消课</span>
                      ) : (
                        <span className="chip-blue">待消课</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-1">{s.className}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                      <GraduationCap className="w-3 h-3" />
                      {s.teacherName}
                      <span className="text-slate-300">·</span>
                      <span>{s.studentIds.length} 人</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="chip-gray flex items-center gap-1">
                        <BookOpenCheck className="w-3 h-3" />
                        {s.questionBankVersionName?.split(" - ")[0] || "v1.0"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-5 xl:p-6">
          {!activeSchedule ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-slate-400" />
              </div>
              <div className="text-base font-bold text-slate-700 mb-1.5">请在左侧选择课次</div>
              <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
                选择后将在此同一面板内完成：学员勾选 → 课时设定 → 题库版本绑定 → 一键消课
                <br />
                全程无跳转，信息同屏可见
              </div>
            </div>
          ) : (
            <ConsumptionFormPanel
              schedule={activeSchedule}
              versions={versions}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onClear={onClear}
              versionId={versionId}
              setVersionId={setVersionId}
              hoursPerStudent={hoursPerStudent}
              setHoursPerStudent={setHoursPerStudent}
              remark={remark}
              setRemark={setRemark}
              onSubmit={onSubmit}
              submitting={submitting}
              onClose={onClose}
              lastConsumedIds={lastConsumedIds}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConsumptionFormPanel({
  schedule,
  versions,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  versionId,
  setVersionId,
  hoursPerStudent,
  setHoursPerStudent,
  remark,
  setRemark,
  onSubmit,
  submitting,
  onClose,
  lastConsumedIds,
}: {
  schedule: ClassSchedule;
  versions: QuestionBankVersion[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClear: () => void;
  versionId: string;
  setVersionId: (v: string) => void;
  hoursPerStudent: number;
  setHoursPerStudent: (n: number) => void;
  remark: string;
  setRemark: (s: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onClose: () => void;
  lastConsumedIds: string[];
}) {
  const students = schedule.students || [];
  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const totalHours = selectedIds.size * hoursPerStudent;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="text-[11px] text-slate-500 mb-1">
            {schedule.date} · {schedule.startTime}–{schedule.endTime} · {schedule.teacherName}
          </div>
          <div className="text-lg font-black text-slate-900 tracking-tight">{schedule.className}</div>
        </div>
        <button onClick={onClose} className="btn-ghost btn-sm" aria-label="收起">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="input-label">本次扣课时 / 人</label>
          <div className="flex items-stretch border border-slate-300 rounded-lg2 overflow-hidden bg-white">
            <button
              className="w-9 hover:bg-slate-50 text-slate-500 flex items-center justify-center"
              onClick={() => setHoursPerStudent(Math.max(0.5, hoursPerStudent - 0.5))}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={hoursPerStudent}
              onChange={(e) => setHoursPerStudent(Math.max(0, Number(e.target.value)))}
              step={0.5}
              className="flex-1 text-center text-base font-bold font-nums border-x border-slate-300 bg-slate-50 focus:outline-none"
            />
            <button
              className="w-9 hover:bg-slate-50 text-slate-500 flex items-center justify-center"
              onClick={() => setHoursPerStudent(hoursPerStudent + 0.5)}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="input-label">关联题库版本</label>
          <div className="relative">
            <select
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              className="input appearance-none pr-8 bg-white"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.version} — {v.bankName} {v.isActive ? "" : "（已停用）"}
                </option>
              ))}
              {versions.length === 0 && <option>暂无启用版本</option>}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-slate-200 rounded-lg2 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => (e.target.checked ? onSelectAll(students.map((s) => s.id)) : onClear())}
                className="w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-600"
              />
              <span className="text-xs font-medium text-slate-700">
                全选学员（{selectedIds.size}/{students.length}）
              </span>
            </label>
          </div>
          <div className="text-xs text-slate-500 font-nums">
            预计扣减 <span className="font-bold text-slate-800">{totalHours}</span> 课时
          </div>
        </div>
        <div className="overflow-y-auto max-h-[260px] lg:max-h-none lg:flex-1 divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">本课次暂无学员</div>
          ) : (
            students.map((stu) => {
              const checked = selectedIds.has(stu.id);
              const shortage = stu.remainingHours < hoursPerStudent;
              const below = stu.remainingHours <= stu.alertThreshold;
              const recentlyConsumed = lastConsumedIds.includes(stu.id);
              return (
                <label
                  key={stu.id}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors",
                    checked ? "bg-slate-50" : "hover:bg-slate-50/50",
                    recentlyConsumed && "animate-flash"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(stu.id)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-600 shrink-0"
                  />
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-white text-xs font-bold flex items-center justify-center">
                    {stu.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{stu.name}</span>
                      {shortage && (
                        <span className="chip-red flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          课时不足
                        </span>
                      )}
                      {!shortage && below && (
                        <span className="chip-amber shrink-0">临近阈值</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-nums">
                      剩余 <span className={cn("font-bold", hoursShortageColor(stu.remainingHours, stu.alertThreshold).split(" ")[0])}>
                        {stu.remainingHours}
                      </span> h
                      <span className="mx-1 text-slate-300">·</span>
                      预警阈值 {stu.alertThreshold}h
                    </div>
                  </div>
                  {below && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      className="chip-amber shrink-0"
                      title="联系家长"
                    >
                      <Phone className="w-3 h-3" />
                      {stu.parentPhone.slice(-4)}
                    </button>
                  )}
                </label>
              );
            })
          )}
        </div>
      </div>

      <div>
        <label className="input-label">备注（可选）</label>
        <input
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="如：补课、请假、试听等，备注将写入操作留痕与报表"
          className="input"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <History className="w-3 h-3" />
          提交后将自动记录操作留痕并同步报表
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-outline btn-sm">
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={selectedIds.size === 0 || submitting || !versionId}
            className="btn-success btn-lg"
          >
            <UserCheck className="w-4 h-4" />
            确认消课 {selectedIds.size > 0 && `(${selectedIds.size}人 · ${totalHours}h)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoursAlertPanel({ alerts }: { alerts: InsufficientAlert[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden border-amber-500/20">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-amber-50 border-b border-amber-500/20"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg2 bg-amber-500 flex items-center justify-center animate-breathe">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-amber-600">课时不足实时提醒</div>
            <div className="text-[11px] text-amber-500/80">共 {alerts.length} 位学员待处理</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
      </button>
      {open && (
        <ul className="divide-y divide-amber-500/10 max-h-[360px] overflow-y-auto">
          {alerts.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-slate-400">
              暂无课时预警，一切正常 ✨
            </li>
          )}
          {alerts.slice(0, 10).map((a) => (
            <li key={a.studentId} className="px-4 py-3 hover:bg-amber-50/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate">{a.studentName}</span>
                  <span className="chip-gray text-[10px]">{a.className || "未分班"}</span>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold font-nums px-1.5 py-0.5 rounded",
                    a.remaining === 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-500"
                  )}
                >
                  剩 {a.remaining}h
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    a.remaining === 0 ? "bg-red-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(100, (a.remaining / Math.max(a.threshold, 1)) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">缺口 {a.shortage || a.threshold - a.remaining}h</span>
                <button className="chip-amber">
                  <Phone className="w-2.5 h-2.5" />
                  联系家长
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickStatsSide({ overview }: { overview: DashboardOverview }) {
  return (
    <div className="card p-4 space-y-4">
      <div>
        <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-mint-500" />
          本周概览
        </div>
        <div className="space-y-2.5">
          {[
            { label: "本周消课", value: (overview.todayConsumedHours * 5).toFixed(1), unit: "h", accent: "bg-mint-500" },
            { label: "消课完成率", value: "78", unit: "%", accent: "bg-slate-800" },
            { label: "家长反馈", value: "12", unit: "条", accent: "bg-amber-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", s.accent)} style={{ width: `${Number(s.value) / 1.5}%` }} />
                </div>
                <span className="text-xs font-bold font-nums text-slate-800 w-14 text-right">
                  {s.value}
                  <span className="text-slate-400 font-normal ml-0.5">{s.unit}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TodayFeedbackCard({ feedbacks }: { feedbacks: Feedback[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-mint-500/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-mint-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">今日家校反馈</div>
            <div className="text-[11px] text-slate-500">将自动写入对应报表与月度复盘</div>
          </div>
        </div>
        <button className="btn-outline btn-sm">查看全部</button>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {feedbacks.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400">
            今日暂无家长反馈
          </div>
        ) : (
          feedbacks.slice(0, 4).map((f) => (
            <div key={f.id} className="p-3.5 rounded-lg2 border border-slate-200 bg-slate-50/40">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[10px] font-bold text-white flex items-center justify-center">
                  {f.studentName?.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-800">{f.studentName}</span>
                {f.rating && (
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: f.rating }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 ml-1 font-nums">
                  {f.createdAt.slice(5, 16)}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{f.content}</p>
              {f.writerRole === "parent" && (
                <div className="mt-2 flex justify-end">
                  <span className="chip-gray text-[10px]">家长反馈</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GlobalAlertDrawer({ alerts }: { alerts: InsufficientAlert[] }) {
  const count = alerts.length;
  if (count === 0) return null;
  return (
    <div className="hidden fixed top-20 right-6 z-50 max-w-xs w-full animate-slide-in-right">
      <div className="card border-amber-500/30 p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 animate-breathe" />
          <div className="text-sm font-bold text-amber-600">{count} 位学员课时不足</div>
        </div>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.slice(0, 3).map((a) => (
            <li key={a.studentId} className="text-xs text-slate-600">
              {a.studentName} 剩 <span className="font-bold text-red-600 font-nums">{a.remaining}</span>h
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
