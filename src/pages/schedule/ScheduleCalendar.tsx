import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, getHours } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { scheduleApi } from '@/api';
import { Schedule } from '@/types';
import { cn, getStatusColor, getStatusText } from '@/utils';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

export default function ScheduleCalendar() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = format(currentWeekStart, 'yyyy-MM-dd');
        const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
        const data = await scheduleApi.getList({ startDate, endDate });
        setSchedules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [currentWeekStart]);

  const getSchedulesForDateTime = (day: Date, hour: number) => {
    return schedules.filter((s) => {
      const start = parseISO(s.startTime);
      const end = parseISO(s.endTime);
      const scheduleStartHour = getHours(start);
      const scheduleEndHour = getHours(end);
      return isSameDay(start, day) && hour >= scheduleStartHour && hour < scheduleEndHour;
    });
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleNewApplication = (date: Date) => {
    navigate(`/applications/new?date=${format(date, 'yyyy-MM-dd')}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-danger-500">{error}</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">排期日历</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 text-sm font-medium text-neutral-700">
              {format(currentWeekStart, 'yyyy年MM月dd日', { locale: zhCN })} - {format(addDays(currentWeekStart, 6), 'MM月dd日', { locale: zhCN })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => handleNewApplication(new Date())}>
            <Plus className="w-4 h-4" />
            新建申请
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-neutral-200">
              <div className="p-3 text-center text-sm font-medium text-neutral-500 bg-neutral-50 border-r border-neutral-200">
                时间
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-3 text-center border-r border-neutral-200 last:border-r-0 cursor-pointer hover:bg-primary-50 transition-colors',
                    isSameDay(day, new Date()) && 'bg-primary-50'
                  )}
                  onClick={() => handleNewApplication(day)}
                >
                  <p className="text-xs text-neutral-500">
                    {format(day, 'EEE', { locale: zhCN })}
                  </p>
                  <p className={cn(
                    'text-lg font-semibold',
                    isSameDay(day, new Date()) && 'text-primary-600'
                  )}>
                    {format(day, 'd')}
                  </p>
                  <div className="flex justify-center mt-1">
                    <Plus className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-neutral-100">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8">
                  <div className="p-2 text-center text-xs text-neutral-500 bg-neutral-50 border-r border-neutral-200 align-top">
                    {hour}:00
                  </div>
                  {weekDays.map((day) => {
                    const daySchedules = getSchedulesForDateTime(day, hour);
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="p-1 border-r border-neutral-200 last:border-r-0 min-h-[60px] align-top"
                      >
                        {daySchedules.map((schedule) => {
                          const isFirstHour = getHours(parseISO(schedule.startTime)) === hour;
                          if (!isFirstHour) return null;
                          const duration = getHours(parseISO(schedule.endTime)) - getHours(parseISO(schedule.startTime));
                          return (
                            <div
                              key={schedule.id}
                              className={cn(
                                'p-2 rounded-lg border-2 mb-1 transition-shadow hover:shadow-md',
                                schedule.conflictStatus === 'PENDING'
                                  ? 'border-danger-400 bg-danger-50'
                                  : 'border-primary-200 bg-primary-50',
                                duration > 1 && `h-[calc(${duration * 60}px-4px)]`
                              )}
                              style={{ minHeight: `${Math.max(duration, 1) * 56 - 8}px` }}
                            >
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {schedule.reagentName}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600">
                                <User className="w-3 h-3" />
                                <span className="truncate">{schedule.applicantName}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {format(parseISO(schedule.startTime), 'HH:mm')} - {format(parseISO(schedule.endTime), 'HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge
                                  variant={
                                    schedule.status === 'COMPLETED'
                                      ? 'success'
                                      : schedule.status === 'IN_PROGRESS'
                                      ? 'warning'
                                      : schedule.status === 'CANCELLED'
                                      ? 'neutral'
                                      : 'primary'
                                  }
                                  className="text-[10px]"
                                >
                                  {getStatusText(schedule.status)}
                                </Badge>
                                {schedule.conflictStatus === 'PENDING' && (
                                  <Badge variant="danger" className="text-[10px]">
                                    冲突
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>排期状态说明</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              <span className="text-sm text-neutral-600">已排期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning-500"></div>
              <span className="text-sm text-neutral-600">进行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
              <span className="text-sm text-neutral-600">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
              <span className="text-sm text-neutral-600">已取消</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger-500"></div>
              <span className="text-sm text-neutral-600">有冲突</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
