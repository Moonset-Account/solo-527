import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { sessionsApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import type { Session } from '@/types';

export default function SessionCalendar() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [currentDate, view]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await sessionsApi.getCalendar(month, year);
      const allSessions = Object.values(data).flat();
      setSessions(allSessions);
    } catch {
      try {
        const data = await sessionsApi.list();
        setSessions(data);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const statusBorder: Record<string, string> = {
    open: 'border-l-green-500',
    full: 'border-l-orange-500',
    closed: 'border-l-gray-400',
    completed: 'border-l-blue-500',
  };

  const statusDot: Record<string, string> = {
    open: 'bg-green-500',
    full: 'bg-orange-500',
    closed: 'bg-gray-400',
    completed: 'bg-blue-500',
  };

  const progressColor: Record<string, string> = {
    open: 'bg-green-500',
    full: 'bg-orange-500',
    closed: 'bg-gray-400',
    completed: 'bg-blue-500',
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const days = view === 'week' ? getWeekDays() : getMonthDays();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Calendar size={22} />
          场次管理
        </h1>
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
              view === 'week'
                ? 'bg-white text-museum shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
              view === 'month'
                ? 'bg-white text-museum shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            月视图
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between stat-card px-5 py-3">
        <button onClick={prevPeriod} className="btn-ghost flex items-center gap-1">
          <ChevronLeft size={18} />
          上一{view === 'week' ? '周' : '月'}
        </button>
        <h2 className="page-title text-base">
          {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          {view === 'week' && (
            <span className="text-slate-400 font-normal text-sm ml-2">
              {getWeekDays()[0].toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              {' - '}
              {getWeekDays()[6].toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </h2>
        <button onClick={nextPeriod} className="btn-ghost flex items-center gap-1">
          下一{view === 'week' ? '周' : '月'}
          <ChevronRight size={18} />
        </button>
      </div>

      {view === 'week' ? (
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const daySessions = sessions.filter((s) => s.date === dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-3 min-h-[160px] transition-all duration-200 slide-up ${
                  isToday
                    ? 'bg-museum/[0.03] border-museum/30 shadow-sm shadow-museum/5'
                    : 'bg-white border-gray-100'
                }`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`text-xs font-medium ${isToday ? 'text-museum' : 'text-slate-400'}`}>
                    {day.toLocaleDateString('zh-CN', { weekday: 'short' })}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 ${
                      isToday ? 'bg-museum text-white' : 'text-slate-600'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {daySessions.slice(0, 3).map((s) => {
                    const ratio = s.capacity > 0 ? s.booked_count / s.capacity : 0;
                    return (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/sessions/${s.id}`)}
                        className={`w-full text-left text-xs p-2 rounded-md border-l-[3px] ${
                          statusBorder[s.status] || 'border-l-gray-300'
                        } bg-gray-50/80 hover:bg-gray-100 hover:shadow-sm transition-all duration-150`}
                      >
                        <p className="font-medium text-slate-700 truncate mb-0.5">{s.course?.name}</p>
                        <p className="text-slate-400 text-[10px] mb-1">
                          {s.start_time} - {s.end_time}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full progress-bar-animated ${progressColor[s.status] || 'bg-gray-300'}`}
                            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {s.booked_count}/{s.capacity}
                        </p>
                      </button>
                    );
                  })}
                  {daySessions.length > 3 && (
                    <p className="text-[10px] text-museum text-center font-medium py-0.5">
                      +{daySessions.length - 3} 更多
                    </p>
                  )}
                  {daySessions.length === 0 && (
                    <p className="text-[10px] text-slate-300 text-center py-4">无场次</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-100">
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((d) => (
              <div key={d} className="py-2.5 text-center text-xs text-slate-400 font-medium tracking-wide">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from(
              { length: (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7 },
              (_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/30" />
              )
            )}
            {days.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const daySessions = sessions.filter((s) => s.date === dateStr);
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={dateStr}
                  className={`min-h-[90px] border-b border-r border-gray-50 p-1.5 transition-colors slide-up ${
                    isToday ? 'bg-museum/[0.04]' : 'hover:bg-gray-50/50'
                  }`}
                  style={{ animationDelay: `${idx * 0.015}s` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs inline-flex items-center justify-center rounded-full w-5 h-5 ${
                        isToday ? 'font-bold text-white bg-museum' : 'text-slate-500'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[9px] text-slate-400">{daySessions.length}场</span>
                    )}
                  </div>
                  {daySessions.slice(0, 2).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded mb-0.5 border-l-2 flex items-center gap-1 ${
                        statusBorder[s.status] || 'border-l-gray-300'
                      } bg-gray-50 hover:bg-museum/5 hover:shadow-sm transition-all duration-150`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[s.status] || 'bg-gray-300'}`} />
                      <p className="truncate text-slate-700">{s.course?.name}</p>
                    </button>
                  ))}
                  {daySessions.length > 2 && (
                    <p className="text-[10px] text-museum font-medium pl-1.5">+{daySessions.length - 2}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
