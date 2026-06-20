import React, { useState } from 'react'
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Space, Select } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  ToolOutlined,
  TeamOutlined,
  SearchOutlined,
  WarningOutlined,
  ReloadOutlined,
  HomeOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard.jsx'
import ResidentBills from './pages/ResidentBills.jsx'
import BillManagement from './pages/BillManagement.jsx'
import PaymentProgress from './pages/PaymentProgress.jsx'
import WorkOrderList from './pages/WorkOrderList.jsx'
import ResidentWorkOrders from './pages/ResidentWorkOrders.jsx'
import VisitorManagement from './pages/VisitorManagement.jsx'
import InspectionManagement from './pages/InspectionManagement.jsx'
import BatchQuery from './pages/BatchQuery.jsx'
import ContractRisk from './pages/ContractRisk.jsx'
import CallbackMonitor from './pages/CallbackMonitor.jsx'

const { Header, Sider, Content } = Layout

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [userType, setUserType] = useState('admin')
  const [currentResidentId, setCurrentResidentId] = useState(1)
  const location = useLocation()
  const navigate = useNavigate()

  const adminMenuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/bills', icon: <FileTextOutlined />, label: '账单管理' },
    { key: '/payment-progress', icon: <SearchOutlined />, label: '收费进度' },
    { key: '/work-orders', icon: <ToolOutlined />, label: '工单管理' },
    { key: '/visitors', icon: <TeamOutlined />, label: '访客管理' },
    { key: '/inspections', icon: <SearchOutlined />, label: '巡检管理' },
    { key: '/batch-query', icon: <SearchOutlined />, label: '批量查询' },
    { key: '/contract-risks', icon: <WarningOutlined />, label: '合同风险' },
    { key: '/callbacks', icon: <ReloadOutlined />, label: '回调监控' }
  ]

  const residentMenuItems = [
    { key: '/my-bills', icon: <HomeOutlined />, label: '我的账单' },
    { key: '/my-work-orders', icon: <ToolOutlined />, label: '我的报修' }
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const switchUserType = (type) => {
    setUserType(type)
    if (type === 'admin') {
      navigate('/dashboard')
    } else {
      navigate('/my-bills')
    }
  }

  return (
    <Layout className="layout-container">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">{collapsed ? '物' : '物业工单中心'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          items={userType === 'admin' ? adminMenuItems : residentMenuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <h2 style={{ margin: 0 }}>物业客服公寓住户报修工单中心</h2>
          <Space>
            <span>切换身份：</span>
            <Select
              value={userType}
              style={{ width: 120 }}
              onChange={switchUserType}
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'resident', label: '住户' }
              ]}
            />
            {userType === 'resident' && (
              <>
                <span>当前住户：</span>
                <Select
                  value={currentResidentId}
                  style={{ width: 150 }}
                  onChange={setCurrentResidentId}
                  options={[
                    { value: 1, label: '1号楼101 张三' },
                    { value: 2, label: '1号楼102 李四' },
                    { value: 3, label: '2号楼201 王五' }
                  ]}
                />
              </>
            )}
          </Space>
        </Header>
        <Content>
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bills" element={<BillManagement />} />
              <Route path="/payment-progress" element={<PaymentProgress />} />
              <Route path="/work-orders" element={<WorkOrderList />} />
              <Route path="/visitors" element={<VisitorManagement />} />
              <Route path="/inspections" element={<InspectionManagement />} />
              <Route path="/batch-query" element={<BatchQuery />} />
              <Route path="/contract-risks" element={<ContractRisk />} />
              <Route path="/callbacks" element={<CallbackMonitor />} />
              <Route path="/my-bills" element={<ResidentBills residentId={currentResidentId} />} />
              <Route path="/my-work-orders" element={<ResidentWorkOrders residentId={currentResidentId} />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
