import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  isAuthenticated: false,
  
  setToken: (token) => {
    localStorage.setItem('token', token);
    const user = jwtDecode(token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          get().logout();
          return false;
        }
        set({ token, user: decoded, isAuthenticated: true });
        return true;
      } catch (error) {
        get().logout();
        return false;
      }
    }
    return false;
  },
  
  hasRole: (roles) => {
    const { user } = get();
    if (!user || !user.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },
}));

export default useAuthStore;
