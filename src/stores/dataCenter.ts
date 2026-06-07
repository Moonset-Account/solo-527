import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Reservation, Violation, GateEntry, SeatCheckin } from '@/types';
import {
  AREAS,
  generateReservations,
  generateGateEntries,
  generateSeatCheckins,
  generateViolations,
} from '@/mock/dataGenerator';
import { useSystemConfigStore } from './systemConfig';
import { eachDayOfInterval, isSameDay } from 'date-fns';

export const useDataCenterStore = defineStore('dataCenter', () => {
  const configStore = useSystemConfigStore();

  const baseReservations = ref<Reservation[]>([]);
  const baseGateEntries = ref<GateEntry[]>([]);
  const baseSeatCheckins = ref<SeatCheckin[]>([]);
  const isInitialized = ref(false);

  function initializeBaseData() {
    if (isInitialized.value) return;
    
    const reservations = generateReservations(
      50000,
      configStore.closedDates,
      configStore.examPeriods,
      configStore.normalNoShowThreshold
    );
    
    baseReservations.value = reservations;
    baseGateEntries.value = generateGateEntries(reservations, 80000);
    baseSeatCheckins.value = generateSeatCheckins(reservations);
    isInitialized.value = true;
  }

  const violations = computed(() => {
    return generateViolations(
      baseReservations.value,
      baseSeatCheckins.value,
      configStore.examPeriods,
      configStore.normalNoShowThreshold
    );
  });

  function getNoShowThresholdForDate(date: Date): number {
    const examPeriod = configStore.examPeriods.find(
      (ep) => date >= ep.startDate && date <= ep.endDate
    );
    return examPeriod ? examPeriod.noShowThreshold : configStore.normalNoShowThreshold;
  }

  const processedReservations = computed(() => {
    return baseReservations.value;
  });

  function filterReservations(
    startDate: Date,
    endDate: Date,
    areaIds?: string[],
    floors?: number[]
  ): Reservation[] {
    return processedReservations.value.filter((r) => {
      const inDateRange = r.startTime >= startDate && r.startTime <= endDate;
      if (!inDateRange) return false;

      if (areaIds && areaIds.length > 0 && !areaIds.includes(r.areaId)) return false;

      if (floors && floors.length > 0) {
        const area = AREAS.find((a) => a.areaId === r.areaId);
        if (!area || !floors.includes(area.floor)) return false;
      }

      return true;
    });
  }

  function filterViolations(
    startDate: Date,
    endDate: Date,
    areaIds?: string[],
    floors?: number[]
  ): Violation[] {
    return violations.value.filter((v) => {
      const inDateRange = v.occurTime >= startDate && v.occurTime <= endDate;
      if (!inDateRange) return false;

      if ((areaIds && areaIds.length > 0) || (floors && floors.length > 0)) {
        const res = baseReservations.value.find((r) => r.reservationId === v.reservationId);
        if (!res) return false;

        if (areaIds && areaIds.length > 0 && !areaIds.includes(res.areaId)) return false;

        if (floors && floors.length > 0) {
          const area = AREAS.find((a) => a.areaId === res.areaId);
          if (!area || !floors.includes(area.floor)) return false;
        }
      }

      return true;
    });
  }

  function filterGateEntries(startDate: Date, endDate: Date): GateEntry[] {
    return baseGateEntries.value.filter((g) => g.entryTime >= startDate && g.entryTime <= endDate);
  }

  function calculateNoShowRateByThreshold(
    reservations: Reservation[],
    startDate: Date,
    endDate: Date
  ): { noShowCount: number; totalReservations: number; noShowRate: number } {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const studentNoShowCounts: Record<string, number> = {};
    let totalReservations = 0;
    
    for (const day of days) {
      const dayReservations = reservations.filter((r) => isSameDay(r.startTime, day));
      totalReservations += dayReservations.length;
      
      dayReservations
        .filter((r) => r.status === 'no_show')
        .forEach((r) => {
          studentNoShowCounts[r.studentId] = (studentNoShowCounts[r.studentId] || 0) + 1;
        });
    }
    
    const avgThreshold = Math.round(
      days.reduce((sum, day) => sum + getNoShowThresholdForDate(day), 0) / days.length
    );
    
    let noShowCount = 0;
    for (const [_, count] of Object.entries(studentNoShowCounts)) {
      if (count > avgThreshold) {
        noShowCount += count;
      }
    }
    
    return {
      noShowCount,
      totalReservations,
      noShowRate: totalReservations > 0 ? noShowCount / totalReservations : 0,
    };
  }

  watch(
    [
      () => configStore.normalNoShowThreshold,
      () => configStore.examPeriods,
    ],
    () => {
      violations.value;
    },
    { deep: true }
  );

  return {
    baseReservations,
    baseGateEntries,
    baseSeatCheckins,
    violations,
    isInitialized,
    initializeBaseData,
    getNoShowThresholdForDate,
    filterReservations,
    filterViolations,
    filterGateEntries,
    calculateNoShowRateByThreshold,
  };
});
