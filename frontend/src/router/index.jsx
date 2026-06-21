import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  CalendarOutlined,
  BellOutlined,
  SkinOutlined,
  ShopOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  ContactsOutlined,
  MoneyCollectOutlined,
  HistoryOutlined,
  UploadOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const Login = lazy(() => import('../pages/Login'))
const Home = lazy(() => import('../pages/Home'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const UserManagement = lazy(() => import('../pages/UserManagement'))
const Settings = lazy(() => import('../pages/Settings'))
const NotFound = lazy(() => import('../pages/NotFound'))
const Cashier = lazy(() => import('../pages/Cashier'))
const MemberList = lazy(() => import('../pages/MemberList'))
const MemberDetail = lazy(() => import('../pages/MemberDetail'))
const TreatmentList = lazy(() => import('../pages/TreatmentList'))
const AppointmentList = lazy(() => import('../pages/AppointmentList'))
const ReminderCenter = lazy(() => import('../pages/ReminderCenter'))
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const ProductManagement = lazy(() => import('../pages/admin/ProductManagement'))
const DamageReportManagement = lazy(() => import('../pages/admin/DamageReportManagement'))
const ReminderRuleManagement = lazy(() => import('../pages/admin/ReminderRuleManagement'))
const ConsultantManagement = lazy(() => import('../pages/admin/ConsultantManagement'))
const CommissionManagement = lazy(() => import('../pages/admin/CommissionManagement'))
const OperationLogList = lazy(() => import('../pages/admin/OperationLogList'))
const BatchImportManagement = lazy(() => import('../pages/admin/BatchImportManagement'))
const PortfolioManagement = lazy(() => import('../pages/admin/PortfolioManagement'))

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />}>
    {children}
  </Suspense>
)

const adminMenuItems = [
  {
    key: '/admin/home',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/admin/dashboard',
    icon: <BarChartOutlined />,
    label: '数据看板',
  },
  {
    key: '/admin/cashier',
    icon: <ShoppingCartOutlined />,
    label: '预约收银台',
  },
  {
    key: '/admin/members',
    icon: <TeamOutlined />,
    label: '会员管理',
  },
  {
    key: '/admin/treatments',
    icon: <SkinOutlined />,
    label: '疗程管理',
  },
  {
    key: '/admin/appointments',
    icon: <CalendarOutlined />,
    label: '预约管理',
  },
  {
    key: '/admin/products',
    icon: <ShopOutlined />,
    label: '产品库存',
  },
  {
    key: '/admin/damage-reports',
    icon: <ExclamationCircleOutlined />,
    label: '报损管理',
  },
  {
    key: '/admin/reminders',
    icon: <BellOutlined />,
    label: '提醒中心',
  },
  {
    key: '/admin/reminder-rules',
    icon: <AlertOutlined />,
    label: '提醒规则',
  },
  {
    key: '/admin/consultants',
    icon: <ContactsOutlined />,
    label: '顾问管理',
  },
  {
    key: '/admin/commissions',
    icon: <MoneyCollectOutlined />,
    label: '提成管理',
  },
  {
    key: '/admin/portfolio',
    icon: <PictureOutlined />,
    label: '作品管理',
  },
  {
    key: '/admin/batch-imports',
    icon: <UploadOutlined />,
    label: '批量导入',
  },
  {
    key: '/admin/operation-logs',
    icon: <HistoryOutlined />,
    label: '操作日志',
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

const mainMenuItems = [
  {
    key: '/home',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/documents',
    icon: <FileTextOutlined />,
    label: '文档',
  },
]

const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><Login /></SuspenseWrapper>,
  },
  {
    path: '/',
    element: <MainLayout menuItems={mainMenuItems} />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: 'documents',
        element: <SuspenseWrapper><div>文档页面</div></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/admin',
    element: <MainLayout menuItems={adminMenuItems} />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/home" replace />,
      },
      {
        path: 'home',
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><Dashboard /></SuspenseWrapper>,
      },
      {
        path: 'cashier',
        element: <SuspenseWrapper><Cashier /></SuspenseWrapper>,
      },
      {
        path: 'members',
        element: <SuspenseWrapper><MemberList /></SuspenseWrapper>,
      },
      {
        path: 'members/:id',
        element: <SuspenseWrapper><MemberDetail /></SuspenseWrapper>,
      },
      {
        path: 'treatments',
        element: <SuspenseWrapper><TreatmentList /></SuspenseWrapper>,
      },
      {
        path: 'appointments',
        element: <SuspenseWrapper><AppointmentList /></SuspenseWrapper>,
      },
      {
        path: 'reminders',
        element: <SuspenseWrapper><ReminderCenter /></SuspenseWrapper>,
      },
      {
        path: 'products',
        element: <SuspenseWrapper><ProductManagement /></SuspenseWrapper>,
      },
      {
        path: 'damage-reports',
        element: <SuspenseWrapper><DamageReportManagement /></SuspenseWrapper>,
      },
      {
        path: 'reminder-rules',
        element: <SuspenseWrapper><ReminderRuleManagement /></SuspenseWrapper>,
      },
      {
        path: 'consultants',
        element: <SuspenseWrapper><ConsultantManagement /></SuspenseWrapper>,
      },
      {
        path: 'commissions',
        element: <SuspenseWrapper><CommissionManagement /></SuspenseWrapper>,
      },
      {
        path: 'portfolio',
        element: <SuspenseWrapper><PortfolioManagement /></SuspenseWrapper>,
      },
      {
        path: 'batch-imports',
        element: <SuspenseWrapper><BatchImportManagement /></SuspenseWrapper>,
      },
      {
        path: 'operation-logs',
        element: <SuspenseWrapper><OperationLogList /></SuspenseWrapper>,
      },
      {
        path: 'users',
        element: <SuspenseWrapper><UserManagement /></SuspenseWrapper>,
      },
      {
        path: 'settings',
        element: <SuspenseWrapper><Settings /></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
  },
])

export default router
