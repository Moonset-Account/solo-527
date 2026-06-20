import { create } from 'zustand';
import type { Knowledge } from '@prisma/client';

interface KnowledgeStore {
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  searchResults: Knowledge[];
  searchTotal: number;
  searchPage: number;
  searchLoading: boolean;
  categories: { category: string; count: number }[];
  hotKnowledge: Knowledge[];
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedType: (type: string) => void;
  setSearchResults: (results: Knowledge[], total: number) => void;
  setSearchPage: (page: number) => void;
  setSearchLoading: (loading: boolean) => void;
  setCategories: (categories: { category: string; count: number }[]) => void;
  setHotKnowledge: (knowledge: Knowledge[]) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  searchQuery: '',
  selectedCategory: '',
  selectedType: '',
  searchResults: [],
  searchTotal: 0,
  searchPage: 1,
  searchLoading: false,
  categories: [],
  hotKnowledge: [],
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category, searchPage: 1 }),
  setSelectedType: (type) => set({ selectedType: type, searchPage: 1 }),
  setSearchResults: (results, total) => set({ searchResults: results, searchTotal: total }),
  setSearchPage: (page) => set({ searchPage: page }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  setCategories: (categories) => set({ categories }),
  setHotKnowledge: (knowledge) => set({ hotKnowledge: knowledge }),
}));
