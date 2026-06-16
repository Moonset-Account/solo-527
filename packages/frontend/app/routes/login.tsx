import { useState } from 'react';
import { useNavigate, Form } from '@remix-run/react';
import { api } from '~/utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result: any = await api.post('/auth/login', { username, password }, { requireAuth: false });
      
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 400,
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 1rem',
          }}>
            🐾
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>宠物寄养管理系统</h1>
          <p className="text-muted text-sm">请登录您的账户</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>测试账号：</div>
          <div>管理员：admin / 123456</div>
          <div>训练师：trainer1 / 123456</div>
          <div>审核员：reviewer / 123456</div>
        </div>
      </div>
    </div>
  );
}
