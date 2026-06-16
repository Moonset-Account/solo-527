import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, List, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppointmentStore } from '@/stores/appointmentStore';

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

export default function AppointmentCalendar() {
  const { calendarAppointments, calendarLoading, fetchCalendar } = useAppointmentStore();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = getDay(monthStart);
  const offset = startDay === 0 ? 6 : startDay - 1;

  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    fetchCalendar(monthStr);
  }, [currentMonth, fetchCalendar]);

  const getAppointmentsForDay = (day: Date) => {
    return calendarAppointments.filter((a) => isSameDay(parseISO(a.appointmentTime.slice(0, 10)), day));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">预约日历</h2>
        <Link to="/appointments" className="flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
          <List size={16} /> 列表视图
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-[#334155] text-[#94A3B8]">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-medium text-[#F1F5F9] w-32 text-center">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-[#334155] text-[#94A3B8]">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        {calendarLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#F97316]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-[#334155]">
              {weekDays.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-sm text-[#94A3B8] font-medium">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-[#334155]/50 p-2 min-h-[80px]" />
              ))}
              {days.map((day) => {
                const apts = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className="border-b border-r border-[#334155]/50 p-2 min-h-[80px]">
                    <span className={`text-sm ${isToday ? 'bg-[#F97316] text-white w-6 h-6 rounded-full inline-flex items-center justify-center' : 'text-[#CBD5E1]'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {apts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${
                            a.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                            a.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {format(parseISO(a.appointmentTime), 'HH:mm')} {a.tenantName}
                        </div>
                      ))}
                      {apts.length > 2 && (
                        <div className="text-xs text-[#64748B]">+{apts.length - 2}更多</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
