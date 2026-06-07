import { create } from 'zustand';
import { FilterState, RentalRecord, UserRole, DISTRICTS, LAYOUTS, SOURCES, ScheduledReport, ReportHistory } from '@/types';
import { MOCK_RECORDS, DATA_UPDATE_TIME } from '@/data/mockData';
import { filterRecords, detectAnomalies, mergeDuplicateRecords, applyRoleBasedFiltering } from '@/utils/dataUtils';

interface AppState {
  allRecords: RentalRecord[];
  baseFilteredRecords: RentalRecord[];
  filteredRecords: RentalRecord[];
  selectedDistrict: string | null;
  selectedCommunity: string | null;
  selectedRecord: RentalRecord | null;
  showDetailDrawer: boolean;
  showScheduledReportModal: boolean;
  filterState: FilterState;
  userRole: UserRole;
  dataUpdateTime: string;
  activeChartTab: 'boxplot' | 'trend' | 'dealcycle';
  mapView: 'district' | 'community';
  selectedRecordsForTrace: string[];
  scheduledReports: ScheduledReport[];
  setFilterState: (filter: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedDistrict: (district: string | null) => void;
  setSelectedCommunity: (community: string | null) => void;
  setSelectedRecord: (record: RentalRecord | null) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowScheduledReportModal: (show: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setActiveChartTab: (tab: 'boxplot' | 'trend' | 'dealcycle') => void;
  setMapView: (view: 'district' | 'community') => void;
  toggleRecordForTrace: (id: string) => void;
  clearTraceSelection: () => void;
  updateRecordAnnotation: (id: string, annotation: string) => void;
  addScheduledReport: (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'history'>) => void;
  toggleScheduledReport: (id: string) => void;
  deleteScheduledReport: (id: string) => void;
  runReportNow: (reportId: string) => ReportHistory | null;
}

const today = new Date();
const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

const initialFilterState: FilterState = {
  districts: [],
  communities: [],
  layouts: [],
  months: [],
  dateRange: [threeMonthsAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]],
  sources: [],
  rentRange: [1000, 30000],
  areaRange: [20, 200],
  buildingAgeRange: [0, 40],
  subwayDistanceRange: [0, 5000],
  dealCycleRange: [0, 90],
  excludeAnomaly: false,
  iqrThreshold: 1.5
};

const processedRecords = detectAnomalies(mergeDuplicateRecords(MOCK_RECORDS), initialFilterState.iqrThreshold);

const getAvailableMonths = (records: RentalRecord[]): string[] => {
  const months = new Set(records.map(r => r.listingDate.substring(0, 7)));
  return Array.from(months).sort();
};

const getAvailableCommunities = (records: RentalRecord[]): string[] => {
  const communities = new Set(records.map(r => r.community));
  return Array.from(communities).sort();
};

export const useAppStore = create<AppState>((set, get) => ({
  allRecords: processedRecords,
  baseFilteredRecords: filterRecords(processedRecords, initialFilterState),
  filteredRecords: applyRoleBasedFiltering(filterRecords(processedRecords, initialFilterState), 'student'),
  selectedDistrict: null,
  selectedCommunity: null,
  selectedRecord: null,
  showDetailDrawer: false,
  showScheduledReportModal: false,
  filterState: initialFilterState,
  userRole: 'student',
  dataUpdateTime: DATA_UPDATE_TIME,
  activeChartTab: 'boxplot',
  mapView: 'district',
  selectedRecordsForTrace: [],
  scheduledReports: [
    {
      id: 'rep-001',
      name: '朝阳区每周租金报告',
      frequency: 'weekly',
      filterState: { ...initialFilterState, districts: ['朝阳区'] },
      email: 'student@example.com',
      enabled: true,
      createdAt: '2026-06-01T00:00:00.000Z',
      lastRunAt: '2026-06-07T08:00:00.000Z',
      history: [
        {
          id: 'hist-001',
          reportId: 'rep-001',
          generatedAt: '2026-06-07T08:00:00.000Z',
          sampleCount: 487,
          anomalyCount: 23,
          avgRent: 7850,
          medianRent: 7200,
          dataUpdateTime: DATA_UPDATE_TIME
        },
        {
          id: 'hist-002',
          reportId: 'rep-001',
          generatedAt: '2026-05-31T08:00:00.000Z',
          sampleCount: 462,
          anomalyCount: 19,
          avgRent: 7680,
          medianRent: 7100,
          dataUpdateTime: '2026-05-31T00:00:00.000Z'
        }
      ]
    }
  ],

  setFilterState: (filter) => {
    const newFilter = { ...get().filterState, ...filter };
    const baseFiltered = filterRecords(get().allRecords, newFilter);
    const roleFiltered = applyRoleBasedFiltering(baseFiltered, get().userRole);
    set({ filterState: newFilter, baseFilteredRecords: baseFiltered, filteredRecords: roleFiltered });
  },

  resetFilters: () => {
    const baseFiltered = filterRecords(get().allRecords, initialFilterState);
    const roleFiltered = applyRoleBasedFiltering(baseFiltered, get().userRole);
    set({ filterState: initialFilterState, baseFilteredRecords: baseFiltered, filteredRecords: roleFiltered });
  },

  setSelectedDistrict: (district) => set({ selectedDistrict: district }),
  setSelectedCommunity: (community) => set({ selectedCommunity: community }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setShowDetailDrawer: (show) => set({ showDetailDrawer: show }),
  setShowScheduledReportModal: (show) => set({ showScheduledReportModal: show }),

  setUserRole: (role) => {
    const roleFiltered = applyRoleBasedFiltering(get().baseFilteredRecords, role);
    set({ userRole: role, filteredRecords: roleFiltered });
  },

  setActiveChartTab: (tab) => set({ activeChartTab: tab }),
  setMapView: (view) => set({ mapView: view }),

  toggleRecordForTrace: (id) => {
    const current = get().selectedRecordsForTrace;
    if (current.includes(id)) {
      set({ selectedRecordsForTrace: current.filter(i => i !== id) });
    } else {
      set({ selectedRecordsForTrace: [...current, id] });
    }
  },

  clearTraceSelection: () => set({ selectedRecordsForTrace: [] }),

  updateRecordAnnotation: (id, annotation) => {
    const updated = get().allRecords.map(r =>
      r.id === id ? { ...r, annotation } : r
    );
    const baseFiltered = filterRecords(updated, get().filterState);
    const roleFiltered = applyRoleBasedFiltering(baseFiltered, get().userRole);
    set({ allRecords: updated, baseFilteredRecords: baseFiltered, filteredRecords: roleFiltered });
  },

  addScheduledReport: (report) => {
    const newReport: ScheduledReport = {
      ...report,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      history: []
    };
    set({ scheduledReports: [...get().scheduledReports, newReport] });
  },

  toggleScheduledReport: (id) => {
    set({
      scheduledReports: get().scheduledReports.map(r =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    });
  },

  deleteScheduledReport: (id) => {
    set({ scheduledReports: get().scheduledReports.filter(r => r.id !== id) });
  },

  runReportNow: (reportId) => {
    const report = get().scheduledReports.find(r => r.id === reportId);
    if (!report) return null;

    const filtered = filterRecords(get().allRecords, report.filterState);
    const anomalyCount = filtered.filter(r => r.isAnomaly).length;
    const avgRent = filtered.length > 0 ? Math.round(filtered.reduce((sum, r) => sum + r.rent, 0) / filtered.length) : 0;
    const sortedRents = filtered.map(r => r.rent).sort((a, b) => a - b);
    const medianRent = sortedRents.length > 0 ? Math.round(sortedRents[Math.floor(sortedRents.length / 2)]) : 0;

    const historyItem: ReportHistory = {
      id: `hist-${Date.now()}`,
      reportId,
      generatedAt: new Date().toISOString(),
      sampleCount: filtered.length,
      anomalyCount,
      avgRent,
      medianRent,
      dataUpdateTime: get().dataUpdateTime
    };

    set({
      scheduledReports: get().scheduledReports.map(r =>
        r.id === reportId
          ? {
              ...r,
              lastRunAt: historyItem.generatedAt,
              history: [historyItem, ...r.history].slice(0, 20)
            }
          : r
      )
    });

    return historyItem;
  }
}));

export const getDefaultFilterState = () => initialFilterState;
export { DISTRICTS, LAYOUTS, SOURCES, getAvailableMonths, getAvailableCommunities };
