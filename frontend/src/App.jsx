import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Tenants from './pages/Tenants';
import Viewings from './pages/Viewings';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import Bills from './pages/Bills';
import Todos from './pages/Todos';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运营概览' },
  { key: '/properties', icon: <HomeOutlined />, label: '房源管理' },
  { key: '/tenants', icon: <UserOutlined />, label: '租客管理' },
  { key: '/viewings', icon: <EyeOutlined />, label: '预约看房' },
  { key: '/contracts', icon: <FileTextOutlined />, label: '合同签署' },
  { key: '/bills', icon: <DollarOutlined />, label: '账单管理' },
  { key: '/todos', icon: <CheckSquareOutlined />, label: '待办事项' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          长租公寓运营后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: 16, padding: 24, background: '#f5f5f5', minHeight: 280, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/viewings" element={<Viewings />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/todos" element={<Todos />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
