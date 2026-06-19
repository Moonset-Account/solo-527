import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FlaskConical, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAppStore();
  const { showToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    try {
      await login(username, password);
      showToast({ type: 'success', message: '登录成功' });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
      showToast({ type: 'error', message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md p-8 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-700 mb-2">试剂库存排期系统</h1>
          <p className="text-neutral-500 text-sm">请登录以继续使用系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              用户名
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              密码
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
          >
            {isLoading ? '登录中...' : '登 录'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <p className="text-center text-sm text-neutral-500">
            测试账号：
            <span className="text-neutral-600 font-medium"> admin / 123456</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-400 text-center">
            <span>设备老师: teacher1</span>
            <span>负责人: principal1</span>
            <span>科研人员: researcher1</span>
            <span>科研人员: researcher2</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
