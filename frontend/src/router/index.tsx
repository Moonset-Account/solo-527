import type { ReactNode } from 'react'
import {
  DesktopOutlined,
  AuditOutlined,
  FileTextOutlined,
  WarningOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons'

export interface RouteConfig {
  path: string
  label: string
  icon: ReactNode
  element: ReactNode
}

import Workbench from '@/pages/workbench'
import Reviews from '@/pages/admin/reviews'
import Prompts from '@/pages/admin/prompts'
import Risks from '@/pages/admin/risks'
import Analytics from '@/pages/analytics'
import Config from '@/pages/config'

export const routes: RouteConfig[] = [
  {
    path: 'workbench',
    label: '客服工作台',
    icon: <DesktopOutlined />,
    element: <Workbench />,
  },
  {
    path: 'admin/reviews',
    label: '内容审核',
    icon: <AuditOutlined />,
    element: <Reviews />,
  },
  {
    path: 'admin/prompts',
    label: '提示词版本',
    icon: <FileTextOutlined />,
    element: <Prompts />,
  },
  {
    path: 'admin/risks',
    label: '风险样本库',
    icon: <WarningOutlined />,
    element: <Risks />,
  },
  {
    path: 'analytics',
    label: '统计仪表盘',
    icon: <BarChartOutlined />,
    element: <Analytics />,
  },
  {
    path: 'config',
    label: '配置管理',
    icon: <SettingOutlined />,
    element: <Config />,
  },
]

export const menuItems = [
  {
    key: 'workbench',
    label: '客服工作台',
    icon: <DesktopOutlined />,
    path: '/workbench',
  },
  {
    key: 'admin',
    label: '后台管理',
    icon: <AuditOutlined />,
    children: [
      {
        key: 'reviews',
        label: '内容审核',
        path: '/admin/reviews',
      },
      {
        key: 'prompts',
        label: '提示词版本',
        path: '/admin/prompts',
      },
      {
        key: 'risks',
        label: '风险样本库',
        path: '/admin/risks',
      },
    ],
  },
  {
    key: 'analytics',
    label: '统计仪表盘',
    icon: <BarChartOutlined />,
    path: '/analytics',
  },
  {
    key: 'config',
    label: '配置管理',
    icon: <SettingOutlined />,
    path: '/config',
  },
]
