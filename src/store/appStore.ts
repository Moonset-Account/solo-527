import { create } from 'zustand';
import { FilterState, RentalRecord, UserRole, DISTRICTS, LAYOUTS, SOURCES } from '@/types';
import { MOCK_RECORDS, DATA_UPDATE_TIME } from '@/data/mockData';
import { filterRecords, detectAnomalies, mergeDuplicateRecords } from '@/utils/dataUtils';

interface AppState {
  allRecords: RentalRecord[];
  filteredRecords: RentalRecord[];
  selectedDistrict: string | null;
  selectedCommunity: string | null;
  selectedRecord: RentalRecord | null;
  showDetailDrawer: boolean;
  filterState: FilterState;
  userRole: UserRole;
  dataUpdateTime: string;
  activeChartTab: 'boxplot' | 'trend' | 'dealcycle';
  mapView: 'district' | 'community';
  selectedRecordsForTrace: string[];
  setFilterState: (filter: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedDistrict: (district: string | null) => void;
  setSelectedCommunity: (community: string | null) => void;
  setSelectedRecord: (record: RentalRecord | null) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setActiveChartTab: (tab: 'boxplot' | 'trend' | 'dealcycle') => void;
  setMapView: (view: 'district' | 'community') => void;
  toggleRecordForTrace: (id: string) => void;
  clearTraceSelection: () => void;
  updateRecordAnnotation: (id: string, annotation: string) => void;
}

const today = new Date();
const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

const initialFilterState: FilterState = {
  districts: [],
  layouts: [],
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

export const useAppStore = create<AppState>((set, get) => ({
  allRecords: processedRecords,
  filteredRecords: filterRecords(processedRecords, initialFilterState),
  selectedDistrict: null,
  selectedCommunity: null,
  selectedRecord: null,
  showDetailDrawer: false,
  filterState: initialFilterState,
  userRole: 'student',
  dataUpdateTime: DATA_UPDATE_TIME,
  activeChartTab: 'boxplot',
  mapView: 'district',
  selectedRecordsForTrace: [],

  setFilterState: (filter) => {
    const newFilter = { ...get().filterState, ...filter };
    const filtered = filterRecords(get().allRecords, newFilter);
    set({ filterState: newFilter, filteredRecords: filtered });
  },

  resetFilters: () => {
    const filtered = filterRecords(get().allRecords, initialFilterState);
    set({ filterState: initialFilterState, filteredRecords: filtered });
  },

  setSelectedDistrict: (district) => set({ selectedDistrict: district }),
  setSelectedCommunity: (community) => set({ selectedCommunity: community }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setShowDetailDrawer: (show) => set({ showDetailDrawer: show }),
  setUserRole: (role) => set({ userRole: role }),
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
    const filtered = filterRecords(updated, get().filterState);
    set({ allRecords: updated, filteredRecords: filtered });
  }
}));

export const getDefaultFilterState = () => initialFilterState;
export { DISTRICTS, LAYOUTS, SOURCES };
