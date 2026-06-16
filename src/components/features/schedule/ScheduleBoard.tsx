"use client";

import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";
import { trpc } from "@/trpc/react";

const teamColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200",
  IN_PROGRESS: "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300",
  COMPLETED: "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
  CANCELLED: "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300",
};

const statusText: Record<string, string> = {
  SCHEDULED: "待开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export function ScheduleBoard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const utils = trpc.useUtils();

  const dateStr = selectedDate.toISOString().split("T")[0];

  const { data: teams = [], isLoading: teamsLoading } =
    trpc.schedule.teams.useQuery();

  const { data: schedules = [], isLoading: schedulesLoading } =
    trpc.schedule.listByDate.useQuery(
      { date: dateStr },
      {
        enabled: teams.length > 0,
      }
    );

  const isLoading = teamsLoading || schedulesLoading;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    utils.schedule.listByDate.invalidate({ date: dateStr });
  };

  const getTeamColor = (index: number) => {
    return teamColors[index % teamColors.length];
  };

  const getScheduleForTeam = (teamId: string) => {
    return schedules.filter((s: any) => s.teamId === teamId);
  };

  const timeToPercent = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = (hours - 8) * 60 + minutes;
    return (totalMinutes / (10 * 60)) * 100;
  };

  const durationToPercent = (start: string, end: string) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startMinutes = (startH - 8) * 60 + startM;
    const endMinutes = (endH - 8) * 60 + endM;
    return ((endMinutes - startMinutes) / (10 * 60)) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">班组排期</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理每日工单排期</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500">加载排期数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">班组排期</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理每日工单排期</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevDay}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatDate(selectedDate)}
              </h2>
            </div>
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium"
            >
              今天
            </button>
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
              安排工单
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-32 flex-shrink-0 p-3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              {teams.length > 0 ? (
                teams.map((team: any, idx: number) => (
                  <div
                    key={team.id}
                    className="flex-1 p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getTeamColor(idx)}`}></div>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {team.name}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 p-3 text-center text-sm text-slate-500">
                  暂无班组数据，请先在系统设置中配置班组
                </div>
              )}
            </div>

            <div className="relative" style={{ height: "480px" }}>
              <div className="absolute inset-0 flex">
                <div className="w-32 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-12 border-b border-slate-100 dark:border-slate-800 px-3 flex items-start justify-end text-xs text-slate-500 dark:text-slate-400 -mt-2"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {teams.length > 0 ? (
                  <div className="flex-1 flex">
                    {teams.map((team: any) => (
                      <div
                        key={team.id}
                        className="flex-1 border-r border-slate-200 dark:border-slate-700 last:border-r-0 relative"
                      >
                        {timeSlots.map((time, idx) => (
                          <div
                            key={time}
                            className="h-12 border-b border-slate-100 dark:border-slate-800"
                          ></div>
                        ))}

                        {getScheduleForTeam(team.id).map((schedule: any) => {
                          const top = timeToPercent(schedule.startTime);
                          const height = durationToPercent(schedule.startTime, schedule.endTime);
                          const vehicle = schedule.workOrder?.vehicle;

                          return (
                            <div
                              key={schedule.id}
                              className={`absolute left-1 right-1 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${
                                statusColors[schedule.status]
                              }`}
                              style={{
                                top: `${top}%`,
                                height: `${height}%`,
                              }}
                              title={`${vehicle?.plateNumber || ''} ${schedule.workOrder?.description || ''}`}
                            >
                              <p className="font-medium text-sm truncate">
                                {vehicle?.plateNumber || schedule.workOrder?.orderNo || '未分配车辆'}
                              </p>
                              <p className="text-xs opacity-75 truncate">
                                {schedule.workOrder?.description || schedule.workOrder?.orderNo}
                              </p>
                              <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">
                                  {statusText[schedule.status]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无班组配置</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600"></span>
            <span className="text-sm text-slate-600 dark:text-slate-300">待开始</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400"></span>
            <span className="text-sm text-slate-600 dark:text-slate-300">进行中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-400"></span>
            <span className="text-sm text-slate-600 dark:text-slate-300">已完成</span>
          </div>
          {schedules.length > 0 && (
            <div className="ml-auto text-sm text-slate-500">
              共 {schedules.length} 条排期
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
