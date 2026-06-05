import { create } from 'zustand';

type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

interface Project {
  id: string;
  name: string;
  clientId: string | null;
  status: ProjectStatus;
  totalAmount: number;
  startDate: Date | null;
  endDate: Date | null;
  description?: string;
}

interface ProjectFilters {
  status?: ProjectStatus;
  clientId?: string;
  search?: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  filters: ProjectFilters;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  filters: {},
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      const { filters } = get();
      if (filters.status) params.set('status', filters.status);
      if (filters.clientId) params.set('clientId', filters.clientId);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      set({ projects: data.data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  updateProjectStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update project status');
      
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, status } : p
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
