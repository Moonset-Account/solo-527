import { useState } from 'react';
import { Form, useNavigate } from '@remix-run/react';
import { authApi } from '~/utils/api';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authApi.login(username, password);
      if (result.success && result.data) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🍵 茶饮门店巡店整改</h1>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
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
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#909399', fontSize: '12px' }}>
          默认账号：admin / 123456
        </div>
      </div>
    </div>
  );
}
