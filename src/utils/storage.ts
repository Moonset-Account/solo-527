import type { SavedFilter } from '@shared/types';

const STORAGE_KEYS = {
  SAVED_FILTERS: 'coldchain_saved_filters',
  DATA_QUALITY_CACHE: 'coldchain_data_quality_cache',
  USER_PREFERENCES: 'coldchain_user_preferences',
};

export const storage = {
  getSavedFilters: (userId: string = 'default'): SavedFilter[] => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.SAVED_FILTERS}_${userId}`);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load saved filters from localStorage:', error);
      return [];
    }
  },

  saveFilter: (name: string, filters: Record<string, any>, userId: string = 'default'): SavedFilter => {
    const savedFilters = storage.getSavedFilters(userId);
    const newFilter: SavedFilter = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      filters,
      createdAt: Date.now(),
    };
    
    savedFilters.unshift(newFilter);
    const toSave = savedFilters.slice(0, 20);
    
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.SAVED_FILTERS}_${userId}`,
        JSON.stringify(toSave)
      );
    } catch (error) {
      console.error('Failed to save filter to localStorage:', error);
    }
    
    return newFilter;
  },

  deleteFilter: (id: string, userId: string = 'default'): boolean => {
    const savedFilters = storage.getSavedFilters(userId);
    const index = savedFilters.findIndex(f => f.id === id);
    
    if (index === -1) return false;
    
    savedFilters.splice(index, 1);
    
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.SAVED_FILTERS}_${userId}`,
        JSON.stringify(savedFilters)
      );
    } catch (error) {
      console.error('Failed to delete filter from localStorage:', error);
      return false;
    }
    
    return true;
  },

  getDataQualityCache: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DATA_QUALITY_CACHE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to load data quality cache:', error);
      return null;
    }
  },

  setDataQualityCache: (data: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA_QUALITY_CACHE, JSON.stringify({
        ...data,
        cachedAt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save data quality cache:', error);
    }
  },

  clearDataQualityCache: () => {
    localStorage.removeItem(STORAGE_KEYS.DATA_QUALITY_CACHE);
  },

  getUserPreferences: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return {};
    }
  },

  setUserPreferences: (prefs: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({
        ...storage.getUserPreferences(),
        ...prefs,
      }));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  },
};

export default storage;
