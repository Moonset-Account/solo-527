import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ContractList from './pages/ContractList';
import ContractUpload from './pages/ContractUpload';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';
import WorkflowConfig from './pages/WorkflowConfig';
import ProgressBoard from './pages/ProgressBoard';
import EfficiencyStats from './pages/EfficiencyStats';
import NotificationList from './pages/NotificationList';

const sidebarConfig = [
  {
    group: '前台',
    items: [
      { path: '/contracts', label: '合同管理', icon: '📋' },
      { path: '/reviews', label: '审查列表', icon: '🔍' },
    ],
  },
  {
    group: '后台',
    items: [
      { path: '/workflows', label: '流程配置', icon: '⚙️' },
      { path: '/efficiency', label: '效率统计', icon: '📊' },
    ],
  },
  {
    group: '协作',
    items: [
      { path: '/progress-board', label: '办理看板', icon: '📋' },
      { path: '/notifications', label: '退回提醒', icon: '🔔' },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">📝</span>
        <span>合同审查工作台</span>
      </div>
      <nav className="sidebar-menu">
        <div className="menu-group">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
          >
            🏠 仪表盘
          </NavLink>
        </div>
        {sidebarConfig.map((group) => (
          <div className="menu-group" key={group.group}>
            <div className="menu-group-title">{group.group}</div>
            {group.items.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/upload" element={<ContractUpload />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/workflows" element={<WorkflowConfig />} />
          <Route path="/progress-board" element={<ProgressBoard />} />
          <Route path="/efficiency" element={<EfficiencyStats />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
