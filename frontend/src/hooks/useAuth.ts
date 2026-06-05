import { useAuth } from '@/store/authStore';

export function useAuthAction() {
  const { login, logout, isAuthenticated } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
  };

  const handleLogout = () => {
    logout();
  };

  return {
    handleLogin,
    handleLogout,
    isAuthenticated,
  };
}
