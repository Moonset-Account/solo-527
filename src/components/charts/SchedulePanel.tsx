"use client";

import { useState } from "react";
import { Clock, User, Edit3, Save, X, ArrowLeftRight, History } from "lucide-react";
import type { Schedule, WorkloadSnapshot } from "@/types";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

interface SchedulePanelProps {
  schedules: Schedule[];
  onAdjust?: (scheduleId: string, changes: Partial<Schedule>) => void;
}

const shiftTypes = [
  { id: "morning", label: "早班", hours: [8, 16], color: "bg-emerald-500" },
  { id: "afternoon", label: "中班", hours: [14, 22], color: "bg-blue-500" },
  { id: "night", label: "晚班", hours: [16, 24], color: "bg-purple-500" },
];

export function SchedulePanel({ schedules, onAdjust }: SchedulePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState({ start: 8, end: 16 });
  const [showHistory, setShowHistory] = useState(false);

  const adjustMutation = trpc.dashboard.adjustSchedule.useMutation();
  const { data: scheduleChanges = [] } = trpc.dashboard.getScheduleChanges.useQuery();

  const handleSave = (scheduleId: string) => {
    const shift = shiftTypes.find(
      (s) => s.hours[0] === editHours.start && s.hours[1] === editHours.end
    );
    adjustMutation.mutate(
      {
        scheduleId,
        startHour: editHours.start,
        endHour: editHours.end,
        shiftType: shift?.id || "flexible",
        reason: "负载优化调整",
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      }
    );
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditHours({ start: schedule.startHour, end: schedule.endHour });
  };

  const groupedSchedules = shiftTypes.map((shift) => ({
    ...shift,
    schedules: schedules.filter(
      (s) => s.shiftType === shift.id ||
        (s.startHour === shift.hours[0] && s.endHour === shift.hours[1])
    ),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-neutral-700">排班调整</h4>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            showHistory
              ? "bg-primary-50 text-primary-700"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          <History className="w-3.5 h-3.5" />
          调班记录
        </button>
      </div>

      {showHistory && (
        <div className="mb-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <h5 className="text-xs font-medium text-neutral-600 mb-3">最近调班记录</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {scheduleChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-100"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary-500" />
                  <div>
                    <div className="text-xs font-medium text-neutral-700">
                      {change.changedBy}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {change.reason}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                    {(change.beforeSnapshot as any).startHour}-{(change.beforeSnapshot as any).endHour}
                  </span>
                  <span className="text-neutral-400">→</span>
                  <span className="px-1.5 py-0.5 bg-primary-100 rounded text-primary-700">
                    {(change.afterSnapshot as any).startHour}-{(change.afterSnapshot as any).endHour}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {groupedSchedules.map((shift) => (
          <div key={shift.id}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-3 h-3 rounded-full", shift.color)} />
              <span className="text-sm font-medium text-neutral-700">
                {shift.label}
              </span>
              <span className="text-xs text-neutral-400">
                {shift.hours[0]}:00 - {shift.hours[1]}:00
              </span>
              <span className="ml-auto text-xs text-neutral-400">
                {shift.schedules.length}人
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {shift.schedules.slice(0, 8).map((schedule) => (
                <div
                  key={schedule.id}
                  className={cn(
                    "p-2 rounded-lg border transition-all group",
                    editingId === schedule.id
                      ? "border-primary-300 bg-primary-50"
                      : "border-neutral-100 bg-white hover:border-primary-200 hover:shadow-sm"
                  )}
                >
                  {editingId === schedule.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={editHours.start}
                          onChange={(e) =>
                            setEditHours({ ...editHours, start: Number(e.target.value) })
                          }
                          className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded"
                        >
                          {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                        <span className="text-xs text-neutral-400">-</span>
                        <select
                          value={editHours.end}
                          onChange={(e) =>
                            setEditHours({ ...editHours, end: Number(e.target.value) })
                          }
                          className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded"
                        >
                          {Array.from({ length: 16 }, (_, i) => i + 12).map((h) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSave(schedule.id)}
                          className="flex-1 p-1.5 rounded bg-primary-500 text-white text-xs hover:bg-primary-600"
                        >
                          <Save className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-[10px] font-medium text-neutral-600">
                          {schedule.staff?.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-neutral-700 truncate max-w-[60px]">
                          {schedule.staff?.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-100 transition-opacity"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
