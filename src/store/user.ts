import { create } from 'zustand';

interface UserState {
  currentUser: {
    id: string;
    name: string;
    role: string;
  } | null;
  setCurrentUser: (user: { id: string; name: string; role: string }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: {
    id: 'user1',
    name: '张工',
    role: 'ADMIN',
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),
}));
