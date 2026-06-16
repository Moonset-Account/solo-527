import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '../components/Layout';
import { authApi, userApi } from '../utils/api';
import { formatDate, getRoleName } from '../utils/format';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度不能少于6位' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(oldPassword, newPassword);
      if (res.success) {
        setMessage({ type: 'success', text: '密码修改成功，请重新登录' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '修改失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="card">
          <p>加载中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-title">个人中心</div>

      <div className="card">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: '#1890ff', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 'bold'
          }}>
            {user.name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '8px' }}>{user.name}</h2>
            <p style={{ color: '#909399', marginBottom: '16px' }}>@{user.username}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span className="tag tag-info">{getRoleName(user.role)}</span>
              {user.store && <span className="tag tag-success">{user.store.name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e8e8e8',
          marginBottom: '24px'
        }}>
          <div 
            style={{ 
              padding: '12px 24px', 
              cursor: 'pointer',
              borderBottom: activeTab === 'info' ? '2px solid #1890ff' : '2px solid transparent',
              color: activeTab === 'info' ? '#1890ff' : '#606266',
              fontWeight: activeTab === 'info' ? '500' : 'normal'
            }}
            onClick={() => setActiveTab('info')}
          >
            基本信息
          </div>
          <div 
            style={{ 
              padding: '12px 24px', 
              cursor: 'pointer',
              borderBottom: activeTab === 'password' ? '2px solid #1890ff' : '2px solid transparent',
              color: activeTab === 'password' ? '#1890ff' : '#606266',
              fontWeight: activeTab === 'password' ? '500' : 'normal'
            }}
            onClick={() => setActiveTab('password')}
          >
            修改密码
          </div>
        </div>

        {activeTab === 'info' && (
          <div>
            <div className="detail-item">
              <div className="detail-label">用户名</div>
              <div className="detail-value">{user.username}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">姓名</div>
              <div className="detail-value">{user.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">角色</div>
              <div className="detail-value">{getRoleName(user.role)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">所属门店</div>
              <div className="detail-value">{user.store?.name || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">手机号</div>
              <div className="detail-value">{user.phone || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">邮箱</div>
              <div className="detail-value">{user.email || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">创建时间</div>
              <div className="detail-value">{formatDate(user.createdAt)}</div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
            {message && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '4px', 
                marginBottom: '16px',
                background: message.type === 'success' ? '#f0f9eb' : '#fef0f0',
                color: message.type === 'success' ? '#67c23a' : '#f56c6c'
              }}>
                {message.text}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">原密码</label>
              <input
                type="password"
                className="form-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">新密码</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '修改中...' : '确认修改'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
