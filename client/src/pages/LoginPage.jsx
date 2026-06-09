import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('请输入用户名和密码', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      showToast('登录成功', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setUsername('admin'); setPassword('Admin@123'); }
    else if (role === 'assistant') { setUsername('assistant1'); setPassword('Assistant@123'); }
    else if (role === 'reviewer') { setUsername('reviewer1'); setPassword('Reviewer@123'); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">📋</span>
          <h1>合同风险标注系统</h1>
          <p>智能识别合同条款风险 · 法务助理专用</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名 / 邮箱</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-4">
          <div className="text-xs text-muted mb-2">演示账号（数据库初始化后可用）：</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => fillDemo('admin')}>管理员</button>
            <button className="btn btn-secondary btn-sm" onClick={() => fillDemo('assistant')}>法务助理</button>
            <button className="btn btn-secondary btn-sm" onClick={() => fillDemo('reviewer')}>复核人</button>
          </div>
        </div>

        <div className="disclaimer mt-4">
          ⚠️ 本系统的AI风险提示仅供参考，不构成法律意见，请咨询专业法律顾问。
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
