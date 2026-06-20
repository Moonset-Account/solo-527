import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Badge } from 'antd-mobile';
import { useAppStore } from '../store';
import MobileHomePage from '../pages/mobile/MobileHomePage';
import MobileApprovalPage from '../pages/mobile/MobileApprovalPage';
import MobileContractsPage from '../pages/mobile/MobileContractsPage';
import MobileNotificationPage from '../pages/mobile/MobileNotificationPage';
import MobileProfilePage from '../pages/mobile/MobileProfilePage';
import MobileProgressPage from '../pages/mobile/MobileProgressPage';

const tabs = [
  { key: '/m', label: '首页', icon: '🏠', component: MobileHomePage },
  { key: '/m/approval', label: '审批', icon: '✅', component: MobileApprovalPage },
  { key: '/m/contracts', label: '合同', icon: '📋', component: MobileContractsPage },
  { key: '/m/notifications', label: '消息', icon: '🔔', component: MobileNotificationPage, badge: true },
  { key: '/m/profile', label: '我的', icon: '👤', component: MobileProfilePage },
];

export default function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, user, fetchUnread } = useAppStore();
  const [activeKey, setActiveKey] = useState('/m');

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  const isTabPage = tabs.some((t) => location.pathname.startsWith(t.key) && t.key !== '/m'
    || (location.pathname === '/m' || location.pathname === '/m/'));

  return (
    <div className="mobile-app">
      <Routes>
        <Route path="/" element={<MobileHomePage />} />
        <Route path="/approval" element={<MobileApprovalPage />} />
        <Route path="/contracts" element={<MobileContractsPage />} />
        <Route path="/notifications" element={<MobileNotificationPage />} />
        <Route path="/profile" element={<MobileProfilePage />} />
        <Route path="/progress/:id" element={<MobileProgressWrapper />} />
      </Routes>

      <div className="mobile-tabbar">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key || (tab.key === '/m' && (activeKey === '/m' || activeKey === '/m/'));
          return (
            <div
              key={tab.key}
              className={`mobile-tabbar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(tab.key)}
            >
              <div style={{ position: 'relative' }}>
                <span className="mobile-tabbar-icon">{tab.icon}</span>
                {tab.badge && unreadCount > 0 && (
                  <span className="badge-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </div>
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileProgressWrapper() {
  const params = new URLSearchParams(window.location.search);
  const id = window.location.pathname.split('/').pop() || params.get('id') || '';
  return <MobileProgressPage contractId={id} />;
}
