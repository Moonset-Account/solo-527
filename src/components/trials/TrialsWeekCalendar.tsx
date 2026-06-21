"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils";
import { StatusChip, trialStatusVariant } from "@/components/ui/StatusChip";

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

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "待试听", COMPLETED: "已完成",
  CANCELLED: "已取消", NO_SHOW: "未到场",
};

const MAJOR_LABELS: Record<string, string> = {
  FINE_ARTS: "美术", DESIGN: "设计", MEDIA: "传媒",
  MUSIC: "音乐", DANCE: "舞蹈", OTHER: "其他",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const STATUS_BG: Record<string, string> = {
  SCHEDULED: "bg-orange-50 border-warn-orange/40 hover:bg-orange-100",
  COMPLETED: "bg-green-50 border-success-green/40 hover:bg-green-100",
  CANCELLED: "bg-slate-50 border-slate-300/50 hover:bg-slate-100",
  NO_SHOW: "bg-red-50 border-alert-red/40 hover:bg-red-100",
};

export function TrialsWeekCalendar({ initialDate }: { initialDate: Date }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const base = new Date(initialDate);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + weekOffset * 7);
  const weekStart = new Date(base);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const [trials, setTrials] = useState<TrialBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/trpc/trials.scheduleList?input=${encodeURIComponent(
            JSON.stringify({
              startDate: weekStart.toISOString(),
              endDate: new Date(weekEnd.getTime() + 86400000).toISOString(),
            }),
          )}`,
        );
        const data = await res.json();
        const items = data?.result?.data?.json || [];
        setTrials(items.map((t: any) => ({ ...t, trialAt: new Date(t.trialAt) })));
      } catch (e) {
        setTrials([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  });

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

  const prevWeek = () => setWeekOffset((w) => w - 1);
  const nextWeek = () => setWeekOffset((w) => w + 1);
  const goToday = () => setWeekOffset(0);

  const weekStats = {
    total: trials.length,
    scheduled: trials.filter((t) => t.status === "SCHEDULED").length,
    completed: trials.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="btn-secondary !px-2 !py-1.5">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToday} className="btn-gold !px-3 !py-1.5 text-xs">
              本周
            </button>
            <button onClick={nextWeek} className="btn-secondary !px-2 !py-1.5">
              <ChevronRight size={16} />
            </button>
          </div>
          <div>
            <div className="font-serif font-semibold text-deep-blue-700 text-lg">
              {formatDate(weekStart, "yyyy年M月d日")} - {formatDate(weekEnd, "M月d日")}
            </div>
            <div className="text-xs text-deep-blue-400 mt-0.5">
              共 <span className="num text-ink-gold-600 font-medium">{weekStats.total}</span> 场试听，
              待试听 <span className="num text-warn-orange font-medium">{weekStats.scheduled}</span> 场，
              已完成 <span className="num text-success-green font-medium">{weekStats.completed}</span> 场
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
            <>
              <div key={`time-${hour}`} className="border-b border-r border-deep-blue-50 px-2 py-1 text-xs text-deep-blue-400 text-right num bg-deep-blue-50/30">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day, di) => {
                const slotTrials = getTrialsForSlot(day, hour);
                const isToday = day.getTime() === today.getTime();
                return (
                  <div
                    key={`slot-${hour}-${di}`}
                    className={cn(
                      "border-b border-r border-deep-blue-50 min-h-[88px] p-1.5 last:border-r-0 relative",
                      isToday && "bg-ink-gold-50/20",
                    )}
                  >
                    {slotTrials.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "rounded-lg border p-2 text-xs space-y-1 mb-1 shadow-sm transition-colors cursor-pointer",
                          STATUS_BG[t.status] || "bg-white border-deep-blue-100",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-deep-blue-800 truncate flex items-center gap-1">
                            <User size={11} className="text-deep-blue-400 shrink-0" />
                            {t.leadName}
                          </span>
                          <StatusChip variant={trialStatusVariant(t.status)} size="sm">
                            {STATUS_LABELS[t.status]}
                          </StatusChip>
                        </div>
                        <div className="flex items-center gap-1 text-deep-blue-500 text-[11px]">
                          <Clock size={10} className="shrink-0" />
                          <span className="num">
                            {formatDateTime(t.trialAt).slice(11, 16)}
                          </span>
                          <span className="text-deep-blue-300">|</span>
                          <span>{MAJOR_LABELS[t.intendedMajor as string] || t.intendedMajor || "未填"}</span>
                        </div>
                        {t.className && (
                          <div className="text-[11px] text-deep-blue-500 truncate">
                            📍 {t.className}{t.teacherName && ` · ${t.teacherName}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
