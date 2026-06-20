'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, CalendarDays, Users, Clock, UserCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { Badge } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { formatDate, cn } from '@/lib/utils';
import type { TeamSchedule, UserProfile, WorkOrder } from '@/lib/types';
import { apiGet, apiPost } from '@/lib/api';

const scheduleSchema = z.object({
  team_id: z.string().min(1, '请选择班组'),
  workorder_id: z.string().min(1, '请选择工单'),
  start_time: z.string().min(1, '请选择开始时间'),
  end_time: z.string().min(1, '请选择结束时间'),
  assignee_ids: z.array(z.string()).min(1, '请至少选择一名人员'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: '结束时间必须晚于开始时间',
  path: ['end_time'],
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

function getDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [startDate, setStartDate] = useState(getDateKey(weekStart));
  const [endDate, setEndDate] = useState(getDateKey(weekEnd));
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesData, usersData, workOrdersData] = await Promise.all([
        apiGet<TeamSchedule[]>('/api/schedules', {
          team_id: teamFilter !== 'all' ? teamFilter : undefined,
          from: startDate,
          to: endDate,
        }),
        apiGet<UserProfile[]>('/api/users'),
        apiGet<WorkOrder[]>('/api/workorders'),
      ]);
      setSchedules(schedulesData);
      setUsers(usersData);
      setWorkOrders(workOrdersData);
    } finally {
      setLoading(false);
    }
  }, [teamFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const teamLeads = useMemo(
    () => users.filter((u) => u.role === 'team_lead' && u.is_active),
    [users],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      team_id: '',
      workorder_id: '',
      start_time: '',
      end_time: '',
      assignee_ids: [],
    },
  });

  const selectedTeamId = watch('team_id');
  const assigneeCandidates = useMemo(() => {
    return users.filter((u) => u.is_active);
  }, [users]);

  const filteredSchedules = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    return schedules.filter((sc) => {
      const scDate = new Date(sc.start_time);
      if (scDate < start || scDate > end) return false;
      if (teamFilter !== 'all' && sc.team_id !== teamFilter) return false;
      return true;
    });
  }, [schedules, startDate, endDate, teamFilter]);

  const calendarDays = useMemo(() => {
    const days: { date: Date; dateKey: string; weekday: string }[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const cur = new Date(start);
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    while (cur <= end) {
      days.push({
        date: new Date(cur),
        dateKey: getDateKey(cur),
        weekday: weekdayNames[cur.getDay()],
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const schedulesByDay = useMemo(() => {
    const map: Record<string, typeof filteredSchedules> = {};
    for (const d of calendarDays) {
      map[d.dateKey] = [];
    }
    for (const sc of filteredSchedules) {
      const key = getDateKey(new Date(sc.start_time));
      if (map[key]) {
        map[key].push(sc);
      }
    }
    return map;
  }, [calendarDays, filteredSchedules]);

  async function onSubmit(data: ScheduleFormData) {
    await apiPost<TeamSchedule>('/api/schedules', data);
    reset();
    setModalOpen(false);
    await fetchData();
  }

  function toggleAssignee(userId: string) {
    const current = watch('assignee_ids') || [];
    if (current.includes(userId)) {
      setValue(
        'assignee_ids',
        current.filter((id) => id !== userId),
        { shouldValidate: true },
      );
    } else {
      setValue('assignee_ids', [...current, userId], { shouldValidate: true });
    }
  }

  return (
    <div>
      <PageHeader
        title="班组排期"
        description="按日期查看班组排班情况，安排工单与人员分配。"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            新建排期
          </button>
        }
      />

      <FilterBar>
        <div className="flex items-center gap-2 items-center">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">日期范围</span>
        </div>
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-slate-400">至</span>
        <input
          type="date"
          className="input"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">全部班组</option>
          {teamLeads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}组
            </option>
          ))}
        </Select>
      </FilterBar>

      <div className="card p-4 overflow-x-auto scrollbar-thin">
        <div
          className="grid gap-3 min-w-max"
          style={{ gridTemplateColumns: `repeat(${calendarDays.length}, minmax(220px, 1fr))` }}
        >
          {calendarDays.map((day) => {
            const isToday = day.dateKey === getDateKey(new Date());
            const daySchedules = schedulesByDay[day.dateKey] || [];
            return (
              <div
                key={day.dateKey}
                className={cn(
                  'rounded-lg border border-slate-200 overflow-hidden',
                  isToday && 'ring-2 ring-brand-500/30 border-brand-400',
                )}
              >
                <div
                  className={cn(
                    'px-3 py-2 border-b border-slate-200 flex items-center justify-between',
                    isToday ? 'bg-brand-50' : 'bg-slate-50',
                  )}
                >
                  <div className="font-medium text-slate-800">
                    {day.weekday}
                  </div>
                  <div
                    className={cn(
                      'text-sm',
                      isToday ? 'text-brand-600 font-semibold' : 'text-slate-500',
                    )}
                  >
                    {formatDate(day.date, false).slice(5)}
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[300px]">
                  {daySchedules
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map((sc) => (
                      <div
                        key={sc.id}
                        className="rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-sm text-slate-900 mb-1 line-clamp-1">
                          {sc.workorder_title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <Badge className="bg-blue-50 text-blue-700">
                            <Users className="w-3 h-3 mr-1" />
                            {sc.team_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(sc.start_time)} - {formatTime(sc.end_time)}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(sc.assignee_names || []).map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                            >
                              <UserCircle2 className="w-3 h-3" />
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  {daySchedules.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-8">
                      暂无排期
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="新建排期"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="btn-primary"
            >
              确认创建
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="label">选择班组</label>
            <select
              className={cn('input', errors.team_id && 'border-red-400')}
              {...register('team_id')}
            >
              <option value="">请选择班组</option>
              {teamLeads.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}组
                </option>
              ))}
            </select>
            {errors.team_id && (
              <p className="text-xs text-red-500 mt-1">{errors.team_id.message}</p>
            )}
          </div>

          <div>
            <label className="label">选择工单</label>
            <select
              className={cn('input', errors.workorder_id && 'border-red-400')}
              {...register('workorder_id')}
            >
              <option value="">请选择工单</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.title}
                </option>
              ))}
            </select>
            {errors.workorder_id && (
              <p className="text-xs text-red-500 mt-1">{errors.workorder_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">开始时间</label>
              <input
                type="datetime-local"
                className={cn('input', errors.start_time && 'border-red-400')}
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-xs text-red-500 mt-1">{errors.start_time.message}</p>
              )}
            </div>
            <div>
              <label className="label">结束时间</label>
              <input
                type="datetime-local"
                className={cn('input', errors.end_time && 'border-red-400')}
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-xs text-red-500 mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">指派人员（多选）</label>
            <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
              {assigneeCandidates.map((u) => {
                const checked = (watch('assignee_ids') || []).includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50 transition-colors',
                      checked && 'bg-brand-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">{u.full_name}</span>
                    <span className="text-xs text-slate-400">
                      {u.role === 'team_lead' ? '班组长' : '其他'}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.assignee_ids && (
              <p className="text-xs text-red-500 mt-1">{errors.assignee_ids.message}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
