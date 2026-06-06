import { create } from 'zustand';
import dayjs from 'dayjs';
import type { FilterContext, FilterOptions } from '../types';

interface FilterStore extends FilterContext {
  filterOptions: FilterOptions | null;
  setRoomIds: (roomIds: string[]) => void;
  setTimeRange: (start: string, end: string) => void;
  setTimeWindow: (window: 'day' | 'week' | 'month') => void;
  setWeekType: (type: 'all' | 'exam' | 'normal') => void;
  setIncludeMaintenance: (include: boolean) => void;
  setDeviceTypes: (types: string[]) => void;
  setFilterOptions: (options: FilterOptions) => void;
  resetFilters: () => void;
}

const getDefaultTimeRange = () => {
  const end = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const start = dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
  return { start, end };
};

export const useFilterStore = create<FilterStore>((set) => ({
  roomIds: [],
  timeRange: getDefaultTimeRange(),
  timeWindow: 'day',
  weekType: 'all',
  includeMaintenance: false,
  deviceTypes: [],
  filterOptions: null,

  setRoomIds: (roomIds) => set({ roomIds }),
  setTimeRange: (start, end) => set({ timeRange: { start, end } }),
  setTimeWindow: (timeWindow) => {
    const end = dayjs();
    let start;
    switch (timeWindow) {
      case 'day':
        start = end.subtract(1, 'day');
        break;
      case 'week':
        start = end.subtract(7, 'day');
        break;
      case 'month':
        start = end.subtract(30, 'day');
        break;
      default:
        start = end.subtract(1, 'day');
    }
    set({
      timeWindow,
      timeRange: {
        start: start.format('YYYY-MM-DD HH:mm:ss'),
        end: end.format('YYYY-MM-DD HH:mm:ss')
      }
    });
  },
  setWeekType: (weekType) => set({ weekType }),
  setIncludeMaintenance: (includeMaintenance) => set({ includeMaintenance }),
  setDeviceTypes: (deviceTypes) => set({ deviceTypes }),
  setFilterOptions: (filterOptions) => set({ filterOptions }),
  resetFilters: () => set({
    roomIds: [],
    timeRange: getDefaultTimeRange(),
    timeWindow: 'day',
    weekType: 'all',
    includeMaintenance: false,
    deviceTypes: []
  })
}));
