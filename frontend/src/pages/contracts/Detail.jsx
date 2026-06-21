import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ContractList from './List'

function ContractDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/contracts')} />
          合同详情
        </h2>
      </div>
      <ContractList />
    </div>
  )
}

export default ContractDetail
