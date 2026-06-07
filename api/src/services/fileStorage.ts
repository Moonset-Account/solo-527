import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { SavedFilter } from '../../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');
const FILTERS_FILE = join(DATA_DIR, 'savedFilters.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFiltersFromFile(): SavedFilter[] {
  ensureDataDir();
  try {
    if (existsSync(FILTERS_FILE)) {
      const content = readFileSync(FILTERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to read saved filters:', error);
  }
  return [];
}

function writeFiltersToFile(filters: SavedFilter[]): void {
  ensureDataDir();
  try {
    writeFileSync(FILTERS_FILE, JSON.stringify(filters, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write saved filters:', error);
  }
}

let cachedFilters: SavedFilter[] | null = null;

export function loadSavedFilters(): SavedFilter[] {
  if (!cachedFilters) {
    cachedFilters = readFiltersFromFile();
  }
  return cachedFilters;
}

export function getSavedFiltersFromStorage(userId: string = 'default'): SavedFilter[] {
  const filters = loadSavedFilters();
  return filters
    .filter(f => f.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function saveFilterToStorage(name: string, filterData: Record<string, any>, userId: string = 'default'): SavedFilter {
  const filters = loadSavedFilters();
  const newFilter: SavedFilter = {
    id: randomUUID(),
    userId,
    name,
    filters: filterData,
    createdAt: Date.now(),
  };
  filters.push(newFilter);
  cachedFilters = filters;
  writeFiltersToFile(filters);
  return newFilter;
}

export function deleteFilterFromStorage(id: string): boolean {
  const filters = loadSavedFilters();
  const index = filters.findIndex(f => f.id === id);
  if (index > -1) {
    filters.splice(index, 1);
    cachedFilters = filters;
    writeFiltersToFile(filters);
    return true;
  }
  return false;
}
