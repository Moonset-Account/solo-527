import { useNavigate } from 'react-router-dom'
import SupplierList from './List'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

function SupplierDetail() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/suppliers')} />
          供应商详情
        </h2>
      </div>
      <SupplierList />
    </div>
  )
}

export default SupplierDetail
