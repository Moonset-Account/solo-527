import { Page, PageHeader } from "@/components/Page";
import { api } from "@/lib/trpc/server";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface TrialBlock {
  id: string;
  leadName: string;
  trialAt: Date;
  durationMinutes: number;
  status: string;
  intendedMajor?: string;
  className?: string;
  teacherName?: string;
  level?: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "待试听", COMPLETED: "已完成",
  CANCELLED: "已取消", NO_SHOW: "未到场",
};

const MAJOR_LABELS: Record<string, string> = {
  FINE_ARTS: "美术", DESIGN: "设计", MEDIA: "传媒",
  MUSIC: "音乐", DANCE: "舞蹈", OTHER: "其他",
};

const STATUS_VARIANT: Record<string, string> = {
  SCHEDULED: "bg-orange-50 border-warn-orange/40 text-warn-orange",
  COMPLETED: "bg-green-50 border-success-green/40 text-success-green",
  CANCELLED: "bg-slate-50 border-slate-300/50 text-deep-blue-500",
  NO_SHOW: "bg-red-50 border-alert-red/40 text-alert-red",
};

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: "bg-warn-orange",
  COMPLETED: "bg-success-green",
  CANCELLED: "bg-slate-400",
  NO_SHOW: "bg-alert-red",
};

function getWeekDates(weekOffset: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + weekOffset * 7);
  const weekStart = new Date(base);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { weekStart, weekEnd };
}

function formatDate(date: Date, pattern = "yyyy-MM-dd") {
  const d = new Date(date);
  const map: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (k) => map[k]);
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default async function TrialsSchedulePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const weekOffset = Number(searchParams.week) || 0;
  const { weekStart, weekEnd } = getWeekDates(weekOffset);

  const caller = await api();
  const trialsData = await caller.trials.scheduleList({
    startDate: weekStart.toISOString(),
    endDate: new Date(weekEnd.getTime() + 86400000).toISOString(),
  });

  const trials: TrialBlock[] = trialsData.map((t: any) => ({
    ...t,
    trialAt: new Date(t.trialAt),
  }));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTrialsForSlot = (day: Date, hour: number) => {
    return trials.filter((t) => {
      const tDay = new Date(t.trialAt);
      tDay.setHours(0, 0, 0, 0);
      const tHour = t.trialAt.getHours();
      return tDay.getTime() === day.getTime() && tHour === hour;
    });
  };

  const weekStats = {
    total: trials.length,
    scheduled: trials.filter((t) => t.status === "SCHEDULED").length,
    completed: trials.filter((t) => t.status === "COMPLETED").length,
    noShow: trials.filter((t) => t.status === "NO_SHOW").length,
  };

  const prevQs = new URLSearchParams({ week: String(weekOffset - 1) }).toString();
  const nextQs = new URLSearchParams({ week: String(weekOffset + 1) }).toString();
  const todayQs = "";

  return (
    <Page>
      <PageHeader
        title="试听周历排期"
        subtitle="按周查看试听安排，直观掌握排期情况"
        breadcrumb={[
          { label: "首页", href: "/" },
          { label: "试听管理", href: "/trials" },
          { label: "周历排期" },
        ]}
        actions={
          <>
            <Link href="/trials" className="btn-secondary">
              <Calendar size={16} />
              返回列表
            </Link>
            <button className="btn-primary">
              <ChevronRight size={16} className="rotate-90" />
              新建试听
            </button>
          </>
        }
      />

      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Link href={`/trials/schedule?${prevQs}`} className="btn-secondary !px-2 !py-1.5">
              <ChevronLeft size={16} />
            </Link>
            <Link href="/trials/schedule" className="btn-gold !px-3 !py-1.5 text-xs">
              本周
            </Link>
            <Link href={`/trials/schedule?${nextQs}`} className="btn-secondary !px-2 !py-1.5">
              <ChevronRight size={16} />
            </Link>
          </div>
          <div>
            <div className="font-serif font-semibold text-deep-blue-700 text-lg">
              {formatDate(weekStart, "yyyy年M月d日")} - {formatDate(weekEnd, "M月d日")}
            </div>
            <div className="text-xs text-deep-blue-400 mt-0.5">
              共 <span className="num text-ink-gold-600 font-medium">{weekStats.total}</span> 场试听 · 
              待试听 <span className="num text-warn-orange font-medium">{weekStats.scheduled}</span> · 
              已完成 <span className="num text-success-green font-medium">{weekStats.completed}</span> · 
              未到场 <span className="num text-alert-red font-medium">{weekStats.noShow}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="chip bg-orange-50 text-warn-orange border-orange-200">待试听</span>
          <span className="chip bg-green-50 text-success-green border-green-200">已完成</span>
          <span className="chip bg-red-50 text-alert-red border-red-200">未到场</span>
          <span className="chip bg-slate-50 text-deep-blue-500 border-slate-200">已取消</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, minmax(0, 1fr))" }}>
          <div className="bg-deep-blue-50/60 border-b border-r border-deep-blue-50 h-14" />
          {weekDays.map((day, i) => {
            const isToday = day.getTime() === today.getTime();
            return (
              <div
                key={i}
                className={cn(
                  "border-b border-r border-deep-blue-50 h-14 p-2 text-center last:border-r-0",
                  isToday && "bg-ink-gold-50/60",
                )}
              >
                <div className={cn(
                  "text-xs font-medium",
                  isToday ? "text-ink-gold-600" : "text-deep-blue-500",
                )}>
                  {WEEKDAYS[day.getDay()]}
                </div>
                <div className={cn(
                  "num text-lg font-semibold mt-0.5",
                  isToday ? "text-ink-gold-600" : "text-deep-blue-700",
                )}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}

          {HOURS.map((hour) => (
            <div key={`row-${hour}`} className="contents">
              <div className="border-b border-r border-deep-blue-50 px-2 py-1 text-xs text-deep-blue-400 text-right num bg-deep-blue-50/30 self-start sticky left-0">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day, di) => {
                const slotTrials = getTrialsForSlot(day, hour);
                const isToday = day.getTime() === today.getTime();
                return (
                  <div
                    key={`slot-${hour}-${di}`}
                    className={cn(
                      "border-b border-r border-deep-blue-50 min-h-[92px] p-1.5 last:border-r-0",
                      isToday && "bg-ink-gold-50/20",
                    )}
                  >
                    {slotTrials.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "rounded-lg border p-2 text-xs space-y-1 mb-1 shadow-sm transition-colors cursor-pointer hover:shadow-md",
                          STATUS_VARIANT[t.status] || "bg-white border-deep-blue-100",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-deep-blue-800 truncate flex items-center gap-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[t.status])} />
                            {t.leadName}
                          </span>
                          <span className="text-[10px] shrink-0 bg-white/60 px-1.5 py-0.5 rounded">
                            {STATUS_LABELS[t.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-deep-blue-500 text-[11px]">
                          <span className="num">
                            {formatDate(t.trialAt, "HH:mm")}
                          </span>
                          <span className="text-deep-blue-300">·</span>
                          <span>{MAJOR_LABELS[t.intendedMajor as string] || t.intendedMajor || "未填"}</span>
                        </div>
                        {t.className && (
                          <div className="text-[11px] text-deep-blue-500 truncate">
                            {t.className}{t.teacherName && ` · ${t.teacherName}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
