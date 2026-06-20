import { Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import Replenishment from '@/pages/Replenishment'
import Allocation from '@/pages/Allocation'
import Supplier from '@/pages/Supplier'
import Exception from '@/pages/Exception'
import DiscrepancyManagement from '@/pages/Admin/DiscrepancyManagement'
import ReceiptManagement from '@/pages/Admin/ReceiptManagement'
import StockoutTrend from '@/pages/Admin/StockoutTrend'
import UserManagement from '@/pages/Admin/UserManagement'
import WarehouseManagement from '@/pages/Admin/WarehouseManagement'
import ProductManagement from '@/pages/Admin/ProductManagement'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '@/api/request'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/auth/login', values)
      if (res?.success || res?.code === 200) {
        const data = res.data || res
        localStorage.setItem('token', data.token || 'mock-token-' + Date.now())
        localStorage.setItem('userInfo', JSON.stringify({
          userId: data.userId,
          username: data.username,
          realName: data.realName,
          role: data.role
        }))
        message.success('登录成功')
        navigate('/dashboard')
      } else {
        throw new Error(res?.message || '登录失败')
      }
    } catch (err) {
      if (values.username === 'admin' && values.password === '123456') {
        localStorage.setItem('token', 'mock-token-' + Date.now())
        localStorage.setItem('userInfo', JSON.stringify({
          userId: 1, username: 'admin', realName: '系统管理员', role: 'Admin'
        }))
        message.success('登录成功（Mock模式）')
        navigate('/dashboard')
      } else if (values.username === 'planner01' && values.password === '123456') {
        localStorage.setItem('token', 'mock-token-' + Date.now())
        localStorage.setItem('userInfo', JSON.stringify({
          userId: 2, username: 'planner01', realName: '张采购', role: 'Planner'
        }))
        message.success('登录成功（Mock模式）')
        navigate('/dashboard')
      } else {
        message.error('用户名或密码错误（提示：admin/123456 或 planner01/123456）')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 50%, #096dd9 100%)'
    }}>
      <Card style={{ width: 420, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8, color: '#096dd9' }}>
            医药批次调拨协同平台
          </h1>
          <p style={{ color: '#8c8c8c', fontSize: 14 }}>Medical Batch Allocation Platform</p>
        </div>
        <Form onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
              登 录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
            <div>管理员：admin / 123456</div>
            <div>采购计划员：planner01 / 123456</div>
          </div>
        </Form>
      </Card>
    </div>
  )
}

const NotFound = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5'
  }}>
    <h1 style={{ fontSize: 72, margin: 0, color: '#1677ff' }}>404</h1>
    <p style={{ fontSize: 20, color: '#666', margin: '16px 0' }}>页面未找到</p>
    <Button type="primary" onClick={() => window.location.href = '/dashboard'}>返回首页</Button>
  </div>
)

const routes = [
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'replenishment', element: <Replenishment /> },
      { path: 'allocation', element: <Allocation /> },
      { path: 'supplier', element: <Supplier /> },
      { path: 'exception', element: <Exception /> },
      { path: 'admin/discrepancy', element: <DiscrepancyManagement /> },
      { path: 'admin/receipt', element: <ReceiptManagement /> },
      { path: 'admin/stockout-trend', element: <StockoutTrend /> },
      { path: 'admin/users', element: <UserManagement /> },
      { path: 'admin/warehouses', element: <WarehouseManagement /> },
      { path: 'admin/products', element: <ProductManagement /> }
    ]
  },
  { path: '*', element: <NotFound /> }
]

export default routes
