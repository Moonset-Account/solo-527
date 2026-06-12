import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store'

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useUserStore()

  const handleBack = () => {
    if (isLoggedIn) {
      if (user?.roles?.some((role: string) => ['ADMIN', 'FINANCE_MANAGER', 'APPROVER'].includes(role))) {
        navigate('/admin/dashboard')
      } else {
        navigate('/portal/apply')
      }
    } else {
      navigate('/login')
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={handleBack}>
            返回首页
          </Button>
        }
      />
    </div>
  )
}

export default NotFound
