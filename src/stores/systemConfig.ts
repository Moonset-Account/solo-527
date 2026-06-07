import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ClosedDate, ExamPeriod } from '@/types';

export const useSystemConfigStore = defineStore('systemConfig', () => {
  const closedDates = ref<ClosedDate[]>([
    { date: new Date(2026, 3, 5), reason: '清明节假期' },
    { date: new Date(2026, 4, 1), reason: '劳动节假期' },
    { date: new Date(2026, 4, 4), reason: '系统维护升级' },
  ]);

  const examPeriods = ref<ExamPeriod[]>([
    {
      startDate: new Date(2026, 4, 15),
      endDate: new Date(2026, 4, 28),
      name: '春季学期期末考试',
      noShowThreshold: 3,
    },
  ]);

  const normalNoShowThreshold = ref(3);
  const remindBeforeMinutes = ref(30);

  function addClosedDate(date: Date, reason: string) {
    closedDates.value.push({ date, reason });
  }

  function removeClosedDate(index: number) {
    closedDates.value.splice(index, 1);
  }

  function addExamPeriod(period: Omit<ExamPeriod, 'noShowThreshold'> & { noShowThreshold?: number }) {
    examPeriods.value.push({
      ...period,
      noShowThreshold: period.noShowThreshold || 3,
    });
  }

  function removeExamPeriod(index: number) {
    examPeriods.value.splice(index, 1);
  }

  function setNormalNoShowThreshold(value: number) {
    normalNoShowThreshold.value = value;
  }

  function setRemindBeforeMinutes(value: number) {
    remindBeforeMinutes.value = value;
  }

  function isExamWeek(date: Date): boolean {
    return examPeriods.value.some(
      (ep) => date >= ep.startDate && date <= ep.endDate
    );
  }

  function isTemporaryClosed(date: Date): boolean {
    return closedDates.value.some(
      (cd) =>
        cd.date.getFullYear() === date.getFullYear() &&
        cd.date.getMonth() === date.getMonth() &&
        cd.date.getDate() === date.getDate()
    );
  }

  function getClosedDateReason(date: Date): string | null {
    const found = closedDates.value.find(
      (cd) =>
        cd.date.getFullYear() === date.getFullYear() &&
        cd.date.getMonth() === date.getMonth() &&
        cd.date.getDate() === date.getDate()
    );
    return found ? found.reason : null;
  }

  function getNoShowThresholdForDate(date: Date): number {
    const examPeriod = examPeriods.value.find(
      (ep) => date >= ep.startDate && date <= ep.endDate
    );
    return examPeriod ? examPeriod.noShowThreshold : normalNoShowThreshold.value;
  }

  return {
    closedDates,
    examPeriods,
    normalNoShowThreshold,
    remindBeforeMinutes,
    addClosedDate,
    removeClosedDate,
    addExamPeriod,
    removeExamPeriod,
    setNormalNoShowThreshold,
    setRemindBeforeMinutes,
    isExamWeek,
    isTemporaryClosed,
    getClosedDateReason,
    getNoShowThresholdForDate,
  };
});
