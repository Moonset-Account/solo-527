import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, Sunrise, Sun } from 'lucide-react';
import { schedulingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import EmptyState from '@/components/EmptyState';
import type { ScheduleAssignment } from '@/types';

export default function MySchedule() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const data = await schedulingApi.list({ guide_id: String(user?.id) });
      setAssignments(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const days: { date: string; label: string; weekday: string; dayNum: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
        weekday: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
        dayNum: String(d.getDate()),
        isToday: i === 0,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getTimeBorder = (startTime: string | undefined) => {
    if (!startTime) return 'border-l-slate-300';
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return 'border-l-amber-400';
    return 'border-l-blue-400';
  };

  const getTimeIcon = (startTime: string | undefined) => {
    if (!startTime) return <Sun size={14} />;
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return <Sunrise size={14} className="text-amber-500" />;
    return <Sun size={14} className="text-blue-500" />;
  };

  const getTimeLabel = (startTime: string | undefined) => {
    if (!startTime) return '';
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return '上午';
    return '下午';
  };

  return (
    <div className="page-enter space-y-6">
      <h1 className="page-title">我的排班</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">本周场次</p>
          <p className="text-2xl font-bold text-museum">{assignments.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">上午场次</p>
          <p className="text-2xl font-bold text-amber-600">
            {assignments.filter((a) => a.session && parseInt(a.session.start_time.split(':')[0], 10) < 12).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">下午场次</p>
          <p className="text-2xl font-bold text-blue-600">
            {assignments.filter((a) => a.session && parseInt(a.session.start_time.split(':')[0], 10) >= 12).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState message="暂无排班安排" description="本周没有为您安排场次" />
      ) : (
        <div className="space-y-5">
          {weekDays.map((day) => {
            const dayAssignments = assignments.filter((a) => a.session?.date === day.date);
            return (
              <div key={day.date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    day.isToday
                      ? 'bg-museum text-white shadow-md shadow-museum/20'
                      : 'bg-white border border-gray-200 text-slate-600'
                  }`}>
                    <span className="text-xs font-medium leading-none">{day.weekday}</span>
                    <span className="text-lg font-bold leading-tight mt-0.5">{day.dayNum}</span>
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${day.isToday ? 'text-museum' : 'text-slate-600'}`}>
                      {day.label}
                    </span>
                    {day.isToday && (
                      <span className="ml-2 px-2 py-0.5 bg-gold/10 text-gold rounded text-xs font-medium">今天</span>
                    )}
                  </div>
                </div>

                {dayAssignments.length === 0 ? (
                  <div className="ml-[17px] pl-7 border-l-2 border-dashed border-gray-100 py-3">
                    <p className="text-sm text-slate-300">暂无安排</p>
                  </div>
                ) : (
                  <div className="ml-[17px] pl-7 border-l-2 border-gray-100 space-y-2">
                    {dayAssignments.map((a, ai) => (
                      <div
                        key={a.id}
                        className={`card-hover bg-white rounded-xl border border-gray-100/80 border-l-4 ${getTimeBorder(a.session?.start_time)} p-4 card-appear stagger-${Math.min(ai + 1, 6)}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getTimeIcon(a.session?.start_time)}
                              <span className="text-xs text-slate-400 font-medium">{getTimeLabel(a.session?.start_time)}</span>
                            </div>
                            <p className="font-semibold text-museum mt-1">{a.session?.course?.name || `课程#${a.session?.course_id}`}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {a.session?.start_time} - {a.session?.end_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={11} /> {a.session?.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={11} /> {a.session?.booked_count}/{a.session?.capacity}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                              <Users size={13} className="text-slate-400" />
                              <span className="text-sm font-semibold text-slate-600">{a.session?.booked_count}</span>
                              <span className="text-xs text-slate-300">/</span>
                              <span className="text-xs text-slate-400">{a.session?.capacity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
