import { useNavigate } from 'react-router-dom';
import { Avatar, Button, List, Dialog, Toast } from 'antd-mobile';
import { useAppStore } from '../../store';
import { UserOutlined, LogoutOutlined, BellOutlined, FileTextOutlined, SafetyOutlined, SettingOutlined, InfoOutlined } from '@ant-design/icons';

export default function MobileProfilePage() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      confirmText: '退出',
      onConfirm: () => { logout(); },
    });
  };

  const menuGroups = [
    {
      title: '我的工作',
      items: [
        { icon: <FileTextOutlined />, label: '我的审批', action: () => navigate('/m/approval') },
        { icon: <BellOutlined />, label: '消息中心', action: () => navigate('/m/notifications') },
      ],
    },
    {
      title: '系统功能',
      items: [
        { icon: <SafetyOutlined />, label: '网页版管理台', action: () => window.location.href = '/dashboard' },
        { icon: <SettingOutlined />, label: '系统设置', action: () => Toast.show({ content: '功能开发中' }) },
        { icon: <InfoOutlined />, label: '关于系统', action: () => Toast.show({ content: '法务合同归档系统 v1.0.0' }) },
      ],
    },
  ];

  const deptMap: Record<string, string> = {
    legal: '法务部', finance: '财务部', admin: '行政部',
    business: '业务部', hr: '人力资源部', other: '其他',
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #667eea 100%)',
        padding: '32px 20px 48px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 600 }}>
            {user?.realName?.[0] || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{user?.realName}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              @{user?.username} · {deptMap[user?.department || ''] || user?.department}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {user?.roles.map((r) => (
                <span key={r} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.2)', color: 'white',
                }}>
                  {r === 'super_admin' ? '超级管理员' : r === 'legal_admin' ? '法务管理员' :
                   r === 'contract_manager' ? '合同管理员' : r === 'approver' ? '审批人' :
                   r === 'applicant' ? '申请人' : r === 'viewer' ? '查看者' : r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', marginTop: -24 }}>
        <div className="mobile-card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            账户信息
          </div>
          <div className="mobile-info-row" style={{ borderBottom: '1px solid #f5f5f5', padding: '10px 0', display: 'flex' }}>
            <div className="mobile-info-label" style={{ width: 80, color: '#8c8c8c', flexShrink: 0 }}>邮箱</div>
            <div style={{ flex: 1, color: '#1f1f1f' }}>{user?.email}</div>
          </div>
          <div className="mobile-info-row" style={{ borderBottom: '1px solid #f5f5f5', padding: '10px 0', display: 'flex' }}>
            <div className="mobile-info-label" style={{ width: 80, color: '#8c8c8c', flexShrink: 0 }}>手机</div>
            <div style={{ flex: 1, color: '#1f1f1f' }}>{user?.phone}</div>
          </div>
          <div className="mobile-info-row" style={{ padding: '10px 0', display: 'flex' }}>
            <div className="mobile-info-label" style={{ width: 80, color: '#8c8c8c', flexShrink: 0 }}>权限数</div>
            <div style={{ flex: 1, color: '#1f1f1f' }}>{user?.permissions.length || 0} 项权限</div>
          </div>
        </div>

        {menuGroups.map((group, gi) => (
          <div key={gi} className="mobile-card" style={{ marginBottom: 12, padding: '4px 16px' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', padding: '12px 0 4px' }}>{group.title}</div>
            <List>
              {group.items.map((it, i) => (
                <List.Item
                  key={i}
                  prefix={it.icon}
                  onClick={it.action}
                  style={{ padding: '12px 0', borderBottom: i === group.items.length - 1 ? 'none' : '1px solid #f5f5f5' }}
                >
                  {it.label}
                </List.Item>
              ))}
            </List>
          </div>
        ))}

        <Button
          block
          color="danger"
          fill="outline"
          size="large"
          onClick={handleLogout}
          style={{ marginTop: 16 }}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
}
