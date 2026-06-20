import { Breadcrumb, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'

const PageHeader = ({ title, breadcrumb, extra, showBack = false }) => {
  const navigate = useNavigate()

  return (
    <div style={{ marginBottom: 16 }}>
      {breadcrumb && (
        <Breadcrumb style={{ marginBottom: 8 }} items={breadcrumb} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {showBack && (
            <Button style={{ marginRight: 12 }} onClick={() => navigate(-1)}>
              返回
            </Button>
          )}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h2>
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  )
}

export default PageHeader
