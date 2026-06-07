import { format, eachDayOfInterval, eachHourOfInterval, isWithinInterval, parseISO } from 'date-fns';
import type { ClosedDate, ExamPeriod } from '@/types';

export function isExamWeek(date: Date, examPeriods: ExamPeriod[]): boolean {
  return examPeriods.some(period => 
    isWithinInterval(date, { start: period.startDate, end: period.endDate })
  );
}

export function isTemporaryClosed(date: Date, closedDates: ClosedDate[]): boolean {
  return closedDates.some(cd => format(cd.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
}

export function getClosedDateReason(date: Date, closedDates: ClosedDate[]): string | null {
  const found = closedDates.find(cd => format(cd.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  return found ? found.reason : null;
}

export function generateDateHours(startDate: Date, endDate: Date): { date: Date; hour: number }[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  
  const result: { date: Date; hour: number }[] = [];
  for (const day of days) {
    for (const hour of hours) {
      result.push({ date: day, hour });
    }
  }
  return result;
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm');
}
