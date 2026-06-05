import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('planner@wedding.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string) => {
    setEmail(email);
    setPassword('password123');
    setLoading(true);
    
    const result = await signIn('credentials', {
      email,
      password: 'password123',
      redirect: false,
    });

    if (!result?.error) {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-blush via-white to-wedding-rose/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Heart className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">婚礼策划协作系统</h1>
          <p className="text-gray-500 mt-2">请登录您的账号</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              登录
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3 text-center">快速登录测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('admin@wedding.com')}
                className="btn btn-secondary text-xs py-1.5"
                disabled={loading}
              >
                管理员
              </button>
              <button
                onClick={() => quickLogin('planner@wedding.com')}
                className="btn btn-secondary text-xs py-1.5"
                disabled={loading}
              >
                策划师
              </button>
              <button
                onClick={() => quickLogin('couple@wedding.com')}
                className="btn btn-secondary text-xs py-1.5"
                disabled={loading}
              >
                新人
              </button>
              <button
                onClick={() => quickLogin('florist@wedding.com')}
                className="btn btn-secondary text-xs py-1.5"
                disabled={loading}
              >
                花艺师
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          默认密码: password123
        </p>
      </div>
    </div>
  );
}
