import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const portalMenuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/booking',
    icon: <CalendarOutlined />,
    label: '房态查询',
  },
  {
    key: '/about',
    icon: <InfoCircleOutlined />,
    label: '关于我们',
  },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout className="min-h-screen bg-white">
      <Header className="bg-white border-b border-gray-200 flex items-center justify-between px-8 h-16">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
            青
          </div>
          <h1 className="text-xl font-bold text-primary-700 m-0">青禾民宿</h1>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={portalMenuItems}
          onClick={handleMenuClick}
          className="border-0 flex-1 justify-center"
        />
        <div className="flex items-center gap-4">
          <span
            className="text-primary-600 cursor-pointer hover:text-primary-700 font-medium"
            onClick={() => navigate('/login')}
          >
            管理登录
          </span>
        </div>
      </Header>
      <Content>
        <Outlet />
      </Content>
      <Footer className="bg-gray-50 border-t border-gray-200 text-center text-gray-500">
        <p className="mb-1">© 2024 青禾民宿 版权所有</p>
        <p className="text-sm">精品民宿 · 用心服务每一位客人</p>
      </Footer>
    </Layout>
  );
}
