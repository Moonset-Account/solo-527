import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import useAuthStore from '@/stores/auth';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      <div className="w-full max-w-md mx-4">
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
              <BellRing className="w-8 h-8" style={{ color: '#f59e0b' }} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">尾款逾期提醒器</h1>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>登录以继续使用</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#cbd5e1' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none transition-colors focus:ring-2"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  ringColor: '#f59e0b',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#cbd5e1' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-lg text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{
                backgroundColor: '#f59e0b',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#d97706')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f59e0b')}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
