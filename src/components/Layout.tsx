import { useState } from 'react'
import { Layout as AntLayout, Menu } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, FileText, BarChart3 } from 'lucide-react'

const { Sider, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <LayoutDashboard size={18} />, label: '催办台总览' },
  { key: '/materials', icon: <FileText size={18} />, label: '材料清单' },
  { key: '/statistics', icon: <BarChart3 size={18} />, label: '数据统计' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntLayout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{ background: '#1E293B' }}
        width={220}
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-700">
          {!collapsed && (
            <span className="text-white text-base font-semibold tracking-wide">
              合同盖章催办台
            </span>
          )}
          {collapsed && (
            <span className="text-amber-400 text-lg font-bold">催</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#1E293B', borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Content className="bg-white min-h-screen p-6" style={{ background: '#F8FAFC' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
