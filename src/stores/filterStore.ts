import { create } from 'zustand';
import dayjs from 'dayjs';
import { FilterState, TimePreset } from '../data/types';

const getDefaultTimeRange = () => {
  const end = dayjs('2025-06-30').format('YYYY-MM-DD');
  const start = dayjs('2024-03-01').format('YYYY-MM-DD');
  return { start, end, preset: 'month' as TimePreset };
};

const STORAGE_VERSION = '1.0.4';

const loadFromSessionStorage = (): Partial<FilterState> | null => {
  try {
    const saved = sessionStorage.getItem('dashboard:lastFilters');
    const version = sessionStorage.getItem('dashboard:storageVersion');
    if (saved && version === STORAGE_VERSION) {
      return JSON.parse(saved);
    }
    sessionStorage.removeItem('dashboard:lastFilters');
    sessionStorage.setItem('dashboard:storageVersion', STORAGE_VERSION);
    return null;
  } catch {
    return null;
  }
};

const savedFilters = loadFromSessionStorage();

interface FilterStore extends FilterState {
  setCourseIds: (ids: string[]) => void;
  setChapterIds: (ids: string[]) => void;
  setStudentIds: (ids: string[]) => void;
  setCohortIds: (ids: string[]) => void;
  setQuestionIds: (ids: string[]) => void;
  setTimeRange: (range: { start: string; end: string; preset: TimePreset }) => void;
  resetFilters: () => void;
  applyFilters: (filters: Partial<FilterState>) => void;
}

const defaultState: FilterState = {
  courseIds: [],
  chapterIds: [],
  studentIds: [],
  cohortIds: [],
  questionIds: [],
  timeRange: getDefaultTimeRange(),
};

const initialState: FilterState = {
  ...defaultState,
  ...savedFilters,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  
  setCourseIds: (ids) => set({ courseIds: ids }),
  setChapterIds: (ids) => set({ chapterIds: ids }),
  setStudentIds: (ids) => set({ studentIds: ids }),
  setCohortIds: (ids) => set({ cohortIds: ids }),
  setQuestionIds: (ids) => set({ questionIds: ids }),
  
  setTimeRange: (range) => set({ timeRange: range }),
  
  resetFilters: () => set({
    courseIds: [],
    chapterIds: [],
    studentIds: [],
    cohortIds: [],
    questionIds: [],
    timeRange: getDefaultTimeRange(),
  }),
  
  applyFilters: (filters) => set((state) => {
    const newState = { ...state, ...filters };
    sessionStorage.setItem('dashboard:lastFilters', JSON.stringify(newState));
    return newState;
  }),
}));

useFilterStore.subscribe((state) => {
  sessionStorage.setItem('dashboard:lastFilters', JSON.stringify(state));
});
