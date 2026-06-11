import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  GraduationCap,
  BookOpenCheck,
  Target,
  Clock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { getSchedulesByRange } from "@/server/services/consumptionService";
import { ClassInfoModel as CIM } from "@/server/models/ClassInfo";
import { StudentModel as SM } from "@/server/models/Student";
import { QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import { ClassScheduleModel as CSM } from "@/server/models/ClassSchedule";
import { formatDate, getWeekDates, cn, hoursShortageColor } from "@/shared/utils";
import type { ClassInfo, ClassSchedule, QuestionBankVersion, ScheduleStatus, Student, User } from "@/shared/types";
import { writeAudit } from "@/server/services/auditService";

const ClassInfoModel: any = CIM;
const StudentModel: any = SM;
const QuestionBankVersionModel: any = QBVM;
const ClassScheduleModel: any = CSM;
const ScheduleModel: any = CSM;

const WEEKDAY = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const TIME_SLOTS = [
  "08:30-10:00", "10:15-11:45",
  "13:30-15:00", "15:15-16:45",
  "17:00-18:30", "19:00-20:30",
];

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  if (user.role === "operator") return redirect("/reports");

  const now = new Date();
  const weekStart = new URLSearchParams();
  const url = new URL(now.toISOString());
  const base = new Date();
  const dates = getWeekDates(base);

  const schedules = await getSchedulesByRange(dates[0], dates[6]).catch(() => [] as ClassSchedule[]);
  const classes: ClassInfo[] = ((await ClassInfoModel.find().lean().catch(() => [])) as any[]).map((c: any) => ({ ...c, id: c._id.toString() }));
  const versions: QuestionBankVersion[] = ((await QuestionBankVersionModel.find({ isActive: true }).lean().catch(() => [])) as any[]).map((v: any) => ({ ...v, id: v._id.toString() }));
  const students: Student[] = ((await StudentModel.find().lean().catch(() => [])) as any[]).map((s: any) => ({ ...s, id: s._id.toString(), className: classes.find((c) => c.id === s.classId)?.name || "" }));

  return json({ schedules, classes, versions, students, weekStart: formatDate(dates[0]) });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = (context as any).user as User | null;
  const ip = (context as any).ip as string;
  if (!user) return redirect("/login");
  const body = await request.json().catch(async () => {
    const fd = await request.formData();
    return Object.fromEntries(fd.entries());
  });
  if (body.type === "create") {
    const cls = body;
    const doc = await ScheduleModel.create({
      classId: cls.classId,
      className: cls.className,
      teacherId: user.id,
      teacherName: user.name,
      date: cls.date,
      startTime: (cls.timeRange as string).split("-")[0],
      endTime: (cls.timeRange as string).split("-")[1],
      questionBankVersionId: cls.questionBankVersionId,
      questionBankVersionName: cls.questionBankVersionName,
      status: "pending" as ScheduleStatus,
      studentIds: JSON.parse(String(cls.studentIds || "[]")),
    });
    await writeAudit(user, "update_schedule", "schedule", doc._id.toString(), { date: cls.date, className: cls.className }, ip);
    return json({ success: true, id: doc._id.toString() });
  }
  return json({ success: false });
}

export default function SchedulePage() {
  const data = useLoaderData<typeof loader>();
  const nav = useNavigate();
  const [offset, setOffset] = useState(0);

  const dates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + offset * 7);
    return getWeekDates(base);
  }, [offset]);

  const today = formatDate(new Date());

  const schedulesByKey = useMemo(() => {
    const map = new Map<string, ClassSchedule[]>();
    for (const s of data.schedules) {
      const key = `${s.date}-${s.startTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [data.schedules]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-slate-800" />
            班级课表（周视图）
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            拖拽调课（Demo标记）、点击卡片直达消课录入 · 题库版本快速切换
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((v) => v - 1)} className="btn-outline btn-sm">
            <ChevronLeft className="w-4 h-4" />上一周
          </button>
          <button onClick={() => setOffset(0)} className="btn-outline btn-sm">
            今天
          </button>
          <button onClick={() => setOffset((v) => v + 1)} className="btn-outline btn-sm">
            下一周<ChevronRight className="w-4 h-4" />
          </button>
          <button className="btn-primary btn-sm ml-2">
            <Plus className="w-3.5 h-3.5" />新增课次
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="font-bold text-slate-700">
          {formatDate(dates[0], "YYYY年MM月DD日")} 至 {formatDate(dates[6], "MM月DD日")}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-mint-500/20 border border-mint-500/40" />已消课</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-800/15 border border-slate-800/30" />待消课</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40" />含预警学员</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
          <div className="bg-slate-50/80 border-b border-r border-slate-200 p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium">时间</div>
          </div>
          {dates.map((d, i) => {
            const dStr = formatDate(d);
            const isToday = dStr === today;
            return (
              <div
                key={i}
                className={cn(
                  "border-b border-slate-200 border-r last:border-r-0 p-2.5 text-center bg-slate-50/60",
                  isToday && "bg-slate-800/5"
                )}
              >
                <div className="text-[10px] text-slate-500 font-medium">{WEEKDAY[i]}</div>
                <div className={cn(
                  "text-sm font-black font-nums mt-0.5",
                  isToday ? "text-slate-800 bg-slate-800 text-white rounded-full w-7 h-7 mx-auto flex items-center justify-center" : "text-slate-700"
                )}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {TIME_SLOTS.map((slot) => {
            const start = slot.split("-")[0];
            return (
              <>
                <div
                  key={`t-${slot}`}
                  className="border-b border-r border-slate-200 px-1.5 py-3 bg-slate-50/40 text-center"
                >
                  <div className="text-[10px] font-nums font-bold text-slate-600 leading-tight">
                    {slot.split("-")[0]}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {slot.split("-")[1]}
                  </div>
                </div>
                {dates.map((d, i) => {
                  const dStr = formatDate(d);
                  const key = `${dStr}-${start}`;
                  const items = schedulesByKey.get(key) || [];
                  return (
                    <div
                      key={`c-${i}-${slot}`}
                      className={cn(
                        "border-b border-r last:border-r-0 border-slate-100 min-h-[72px] p-1.5 space-y-1.5",
                        items.length === 0 && "bg-slate-50/20"
                      )}
                    >
                      {items.length === 0 && (
                        <button className="w-full h-full min-h-[56px] border border-dashed border-slate-200 rounded text-[10px] text-slate-300 hover:border-slate-400 hover:text-slate-500 transition-colors flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" />添加
                        </button>
                      )}
                      {items.map((s) => (
                        <ScheduleCard key={s.id} s={s} students={data.students} />
                      ))}
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      <QuickAddPanel classes={data.classes} versions={data.versions} students={data.students} defaultDate={today} />
    </div>
  );
}

function ScheduleCard({ s, students }: { s: ClassSchedule; students: Student[] }) {
  const nav = useNavigate();
  const enrolled = students.filter((st) => s.studentIds.includes(st.id));
  const lowHours = enrolled.some((st) => st.remainingHours <= st.alertThreshold);
  const completed = s.status === "completed";
  return (
    <div
      onClick={() => nav("/dashboard")}
      className={cn(
        "group rounded-lg2 p-2 cursor-pointer transition-all text-left border",
        completed
          ? "bg-mint-50 border-mint-500/20 hover:border-mint-500/40"
          : lowHours
            ? "bg-amber-50 border-amber-500/20 hover:border-amber-500/40 hover:shadow-card"
            : "bg-slate-800/[0.04] border-slate-800/10 hover:border-slate-800/25 hover:shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">{s.className}</div>
        {completed ? (
          <span className="chip-green text-[9px] shrink-0 py-0">已完成</span>
        ) : lowHours ? (
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 animate-breathe" />
        ) : (
          <Target className="w-3 h-3 text-slate-500 shrink-0 opacity-60 group-hover:opacity-100" />
        )}
      </div>
      <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1.5">
        <GraduationCap className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{s.teacherName}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="chip-gray text-[9px] py-0 px-1.5 flex items-center gap-0.5">
          <BookOpenCheck className="w-2 h-2" />
          {(s.questionBankVersionName || "v1.0").split(" - ")[0]}
        </span>
        <span className="chip-gray text-[9px] py-0 px-1.5 flex items-center gap-0.5">
          <UserCheck className="w-2 h-2" />{enrolled.length}
        </span>
      </div>
    </div>
  );
}

function QuickAddPanel({
  classes, versions, students, defaultDate,
}: {
  classes: ClassInfo[]; versions: QuestionBankVersion[]; students: Student[]; defaultDate: string;
}) {
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [date, setDate] = useState(defaultDate);
  const [timeRange, setTimeRange] = useState(TIME_SLOTS[0]);
  const [versionId, setVersionId] = useState(versions[0]?.id || "");
  const selectedClass = classes.find((c) => c.id === classId);
  const inClassStudents = students.filter((s) => s.classId === classId);

  return (
    <div className="card p-5">
      <div className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-slate-800" />快速新增课次
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="input-label">班级</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="input-label">时间段</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="input">
            {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">题库版本</label>
          <select value={versionId} onChange={(e) => setVersionId(e.target.value)} className="input">
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.version} - {v.bankName}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary flex-1">
            <Plus className="w-4 h-4" />保存课次
          </button>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">默认学员（{selectedClass?.name} · {inClassStudents.length} 人）</div>
        <div className="flex flex-wrap gap-1.5">
          {inClassStudents.length === 0 && <span className="text-xs text-slate-400">该班暂无学员</span>}
          {inClassStudents.slice(0, 12).map((s) => (
            <span
              key={s.id}
              className={cn(
                "chip py-0.5",
                s.remainingHours <= s.alertThreshold ? "bg-amber-500/12 text-amber-600" : "bg-slate-100 text-slate-600"
              )}
            >
              {s.name}
              <span className="font-nums ml-1 opacity-80">{s.remainingHours}h</span>
            </span>
          ))}
          {inClassStudents.length > 12 && <span className="chip py-0.5">+{inClassStudents.length - 12}</span>}
        </div>
      </div>
    </div>
  );
}
