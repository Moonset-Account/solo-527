import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Shield, Users, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '../../shared/types';

const roles: { role: UserRole; label: string; icon: React.ElementType; account: string; password: string }[] = [
  { role: 'admin', label: '管理员', icon: Shield, account: 'admin', password: 'password123' },
  { role: 'coach', label: '教练', icon: Dumbbell, account: 'coach1', password: 'password123' },
  { role: 'receptionist', label: '前台', icon: Users, account: 'receptionist1', password: 'password123' },
  { role: 'member', label: '会员', icon: User, account: 'member1', password: 'password123' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const handleRoleSelect = (r: typeof roles[number]) => {
    setSelectedRole(r.role);
    setUsername(r.account);
    setPassword(r.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-4">
            <Dumbbell className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white">FIT PRO</h1>
          <p className="text-gray-400 mt-2">健身房私教管理系统</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="grid grid-cols-4 gap-2 mb-6">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.role}
                  onClick={() => handleRoleSelect(r)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-btn transition-all ${
                    selectedRole === r.role
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-btn text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-btn text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="text-danger text-sm text-center bg-danger/10 py-2 rounded-btn">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold rounded-btn transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              登录
            </button>
          </form>

          <div className="mt-6 p-3 bg-white/5 rounded-btn">
            <p className="text-xs text-gray-400 text-center mb-2">测试账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>admin / password123</span>
              <span>coach1 / password123</span>
              <span>receptionist1 / password123</span>
              <span>member1 / password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
