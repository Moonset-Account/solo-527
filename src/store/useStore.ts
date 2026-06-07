import { create } from 'zustand';
import {
  FilterState,
  Candidate,
  StageType,
  CandidateStatus,
  KPIData,
  TrendDataPoint,
  FunnelDataPoint,
  StageDurationData,
  ChannelQualityData,
  InterviewerLoadData,
  DataQualityReport,
} from '../data/types';
import { candidates, departments, positions, recruiters, channels, interviewers, STAGE_ORDER, STAGE_NAMES } from '../data/mockData';
import { format, eachMonthOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface StoreState {
  filters: FilterState;
  filteredCandidates: Candidate[];
  allCandidates: Candidate[];
  departments: typeof departments;
  positions: typeof positions;
  recruiters: typeof recruiters;
  channels: typeof channels;
  interviewers: typeof interviewers;
  selectedCandidate: Candidate | null;
  setDateRange: (range: [Date, Date]) => void;
  setDepartments: (depts: string[]) => void;
  setPositions: (pos: string[]) => void;
  setRecruiters: (rec: string[]) => void;
  setChannels: (ch: string[]) => void;
  setStages: (st: StageType[]) => void;
  setStatus: (st: CandidateStatus[]) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  resetFilters: () => void;
  getKPIData: () => KPIData;
  getTrendData: () => TrendDataPoint[];
  getFunnelData: () => FunnelDataPoint[];
  getStageDurationData: () => StageDurationData[];
  getChannelQualityData: () => ChannelQualityData[];
  getInterviewerLoadData: () => InterviewerLoadData[];
  getDataQualityReport: () => DataQualityReport;
  drillDown: (dimension: string, value: string) => void;
}

const defaultFilters: FilterState = {
  dateRange: [new Date('2026-01-01'), new Date('2026-06-30')],
  departments: [],
  positions: [],
  recruiters: [],
  channels: [],
  stages: [],
  status: [],
};

function filterCandidates(candidates: Candidate[], filters: FilterState): Candidate[] {
  return candidates.filter(c => {
    if (!isWithinInterval(c.applyDate, { start: filters.dateRange[0], end: filters.dateRange[1] })) {
      return false;
    }
    if (filters.departments.length > 0 && !filters.departments.includes(c.departmentId)) return false;
    if (filters.positions.length > 0 && !filters.positions.includes(c.positionId)) return false;
    if (filters.recruiters.length > 0 && !filters.recruiters.includes(c.recruiterId)) return false;
    if (filters.channels.length > 0 && !filters.channels.includes(c.channelId)) return false;
    if (filters.stages.length > 0 && !filters.stages.includes(c.currentStage)) return false;
    if (filters.status.length > 0 && !filters.status.includes(c.status)) return false;
    return true;
  });
}

export const useStore = create<StoreState>((set, get) => ({
  filters: defaultFilters,
  filteredCandidates: candidates,
  allCandidates: candidates,
  departments,
  positions,
  recruiters,
  channels,
  interviewers,
  selectedCandidate: null,

  setDateRange: (range) => set(state => {
    const newFilters = { ...state.filters, dateRange: range };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setDepartments: (depts) => set(state => {
    const newFilters = { ...state.filters, departments: depts };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setPositions: (pos) => set(state => {
    const newFilters = { ...state.filters, positions: pos };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setRecruiters: (rec) => set(state => {
    const newFilters = { ...state.filters, recruiters: rec };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setChannels: (ch) => set(state => {
    const newFilters = { ...state.filters, channels: ch };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setStages: (st) => set(state => {
    const newFilters = { ...state.filters, stages: st };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setStatus: (st) => set(state => {
    const newFilters = { ...state.filters, status: st };
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),

  resetFilters: () => set({
    filters: defaultFilters,
    filteredCandidates: candidates,
  }),

  drillDown: (dimension, value) => set(state => {
    const newFilters = { ...state.filters };
    switch (dimension) {
      case 'department':
        newFilters.departments = [value];
        break;
      case 'position':
        newFilters.positions = [value];
        break;
      case 'recruiter':
        newFilters.recruiters = [value];
        break;
      case 'channel':
        newFilters.channels = [value];
        break;
      case 'stage':
        newFilters.stages = [value as StageType];
        break;
    }
    return {
      filters: newFilters,
      filteredCandidates: filterCandidates(state.allCandidates, newFilters),
    };
  }),

  getKPIData: () => {
    const { filteredCandidates } = get();
    const positionIds = new Set(filteredCandidates.map(c => c.positionId));
    const resumeCount = filteredCandidates.length;
    const interviewCount = filteredCandidates.filter(c =>
      STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('interview_1')
    ).length;
    const offerCount = filteredCandidates.filter(c =>
      STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('offer')
    ).length;
    const onboardCount = filteredCandidates.filter(c => c.status === 'hired').length;
    const hiredCandidates = filteredCandidates.filter(c => c.status === 'hired');
    const avgCycleDays = hiredCandidates.length > 0
      ? hiredCandidates.reduce((sum, c) => sum + (c.totalCycleDays || 0), 0) / hiredCandidates.length
      : 0;
    const conversionRate = resumeCount > 0 ? (onboardCount / resumeCount) * 100 : 0;
    const offerCandidates = filteredCandidates.filter(c =>
      STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('offer')
    );
    const offerAcceptCount = offerCandidates.filter(c => c.status !== 'offer_declined').length;
    const offerAcceptRate = offerCandidates.length > 0 ? (offerAcceptCount / offerCandidates.length) * 100 : 0;

    return {
      positionCount: positionIds.size,
      resumeCount,
      interviewCount,
      offerCount,
      onboardCount,
      avgCycleDays: Math.round(avgCycleDays * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      offerAcceptRate: Math.round(offerAcceptRate * 10) / 10,
    };
  },

  getTrendData: () => {
    const { filters, filteredCandidates } = get();
    const months = eachMonthOfInterval({ start: filters.dateRange[0], end: filters.dateRange[1] });

    return months.map(month => {
      const monthCandidates = filteredCandidates.filter(c =>
        format(c.applyDate, 'yyyy-MM') === format(month, 'yyyy-MM')
      );

      return {
        date: format(month, 'yyyy年M月', { locale: zhCN }),
        resumeCount: monthCandidates.length,
        interviewCount: monthCandidates.filter(c =>
          STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('interview_1')
        ).length,
        offerCount: monthCandidates.filter(c =>
          STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('offer')
        ).length,
        onboardCount: monthCandidates.filter(c => c.status === 'hired').length,
      };
    });
  },

  getFunnelData: () => {
    const { filteredCandidates } = get();
    const funnel: FunnelDataPoint[] = [];
    let prevCount = filteredCandidates.length;

    STAGE_ORDER.forEach((stage, index) => {
      const count = filteredCandidates.filter(c =>
        STAGE_ORDER.indexOf(c.currentStage) >= index
      ).length;
      funnel.push({
        stage: STAGE_NAMES[stage],
        stageType: stage,
        count,
        conversionRate: prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 0,
      });
      prevCount = count;
    });

    return funnel;
  },

  getStageDurationData: () => {
    const { filteredCandidates } = get();
    const result: StageDurationData[] = [];

    STAGE_ORDER.forEach(stage => {
      const durations: number[] = [];
      filteredCandidates.forEach(c => {
        const stageRecord = c.stages.find(s => s.stage === stage);
        if (stageRecord && stageRecord.durationDays !== undefined) {
          durations.push(stageRecord.durationDays);
        }
      });

      if (durations.length > 0) {
        durations.sort((a, b) => a - b);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const median = durations[Math.floor(durations.length / 2)];
        const p75 = durations[Math.floor(durations.length * 0.75)];
        const p90 = durations[Math.floor(durations.length * 0.90)];
        const min = durations[0];
        const max = durations[durations.length - 1];

        result.push({
          stage: STAGE_NAMES[stage],
          stageType: stage,
          avgDays: Math.round(avg * 10) / 10,
          medianDays: median,
          p75Days: p75,
          p90Days: p90,
          minDays: min,
          maxDays: max,
        });
      }
    });

    return result;
  },

  getChannelQualityData: () => {
    const { filteredCandidates, channels } = get();
    const result: ChannelQualityData[] = [];

    channels.forEach(channel => {
      const channelCandidates = filteredCandidates.filter(c => c.channelId === channel.id);
      if (channelCandidates.length === 0) return;

      const resumeCount = channelCandidates.length;
      const interviewCount = channelCandidates.filter(c =>
        STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('interview_1')
      ).length;
      const offerCount = channelCandidates.filter(c =>
        STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf('offer')
      ).length;
      const onboardCount = channelCandidates.filter(c => c.status === 'hired').length;

      const interviewRate = resumeCount > 0 ? (interviewCount / resumeCount) * 100 : 0;
      const offerRate = interviewCount > 0 ? (offerCount / interviewCount) * 100 : 0;
      const onboardRate = offerCount > 0 ? (onboardCount / offerCount) * 100 : 0;
      const costPerHire = onboardCount > 0 ? channel.costPerCandidate * resumeCount / onboardCount : 0;
      const qualityScore = Math.min(100, (interviewRate * 0.3 + offerRate * 0.3 + onboardRate * 0.4));

      result.push({
        channelId: channel.id,
        channelName: channel.name,
        resumeCount,
        interviewRate: Math.round(interviewRate * 10) / 10,
        offerRate: Math.round(offerRate * 10) / 10,
        onboardRate: Math.round(onboardRate * 10) / 10,
        costPerHire: Math.round(costPerHire),
        qualityScore: Math.round(qualityScore),
      });
    });

    return result.sort((a, b) => b.qualityScore - a.qualityScore);
  },

  getInterviewerLoadData: () => {
    const { filteredCandidates, interviewers } = get();
    const result: InterviewerLoadData[] = [];
    const interviewerStats: Record<string, { count: number; hours: number }> = {};

    filteredCandidates.forEach(c => {
      c.stages.forEach(s => {
        if (s.interviewerId && s.interviewerName) {
          if (!interviewerStats[s.interviewerId]) {
            interviewerStats[s.interviewerId] = { count: 0, hours: 0 };
          }
          interviewerStats[s.interviewerId].count++;
          interviewerStats[s.interviewerId].hours += 1.5;
        }
      });
    });

    interviewers.forEach(iv => {
      const stats = interviewerStats[iv.id] || { count: 0, hours: 0 };
      const weeks = 26;
      result.push({
        interviewerId: iv.id,
        interviewerName: iv.name,
        department: iv.department,
        interviewCount: stats.count,
        totalHours: Math.round(stats.hours * 10) / 10,
        avgPerWeek: Math.round((stats.count / weeks) * 10) / 10,
      });
    });

    return result.sort((a, b) => b.interviewCount - a.interviewCount);
  },

  getDataQualityReport: () => {
    const { allCandidates } = get();
    const totalRecords = allCandidates.length;
    const missingFields = [];

    let missingCount = 0;
    allCandidates.forEach(c => {
      if (!c.recruiterId) missingCount++;
    });
    missingFields.push({ field: 'recruiterId', count: missingCount, percentage: Math.round((missingCount / totalRecords) * 1000) / 10 });

    missingCount = 0;
    allCandidates.forEach(c => {
      if (c.stages.some(s => !s.endDate && s.result !== undefined)) missingCount++;
    });
    missingFields.push({ field: 'stage.endDate', count: missingCount, percentage: Math.round((missingCount / totalRecords) * 1000) / 10 });

    missingCount = 0;
    allCandidates.forEach(c => {
      if (!c.feedback && c.status !== 'in_progress') missingCount++;
    });
    missingFields.push({ field: 'feedback', count: missingCount, percentage: Math.round((missingCount / totalRecords) * 1000) / 10 });

    const anomalyCount = allCandidates.filter(c => c.stages.some(s => s.isAnomaly)).length;
    const duplicateCount = 0;
    const completedFields = totalRecords * 7 - missingFields.reduce((sum, f) => sum + f.count, 0);
    const dataCompleteness = Math.round((completedFields / (totalRecords * 7)) * 1000) / 10;

    return {
      totalRecords,
      missingFields,
      anomalyCount,
      duplicateCount,
      dataCompleteness,
    };
  },
}));
