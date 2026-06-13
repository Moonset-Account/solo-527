import React, { useState, useEffect } from 'react'
import { Descriptions, Card, Table, Tag, Button, Space, List, message } from 'antd'
import { ArrowLeftOutlined, EditOutlined, SendOutlined, DownloadOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getPurchaseRequestDetail, submitPurchaseRequest, approveRequest, rejectRequest } from '../../services/api'

const statusMap = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审批中', color: 'processing' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
  completed: { text: '已完成', color: 'blue' },
}

const PurchaseRequestDetail = () => {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const data = await getPurchaseRequestDetail(id)
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleSubmit = async () => {
    try {
      await submitPurchaseRequest(id)
      message.success('提交成功')
      fetchDetail()
    } catch (e) {}
  }

  const itemColumns = [
    { title: '物料名称', dataIndex: 'materialName' },
    { title: '规格型号', dataIndex: 'specification' },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '数量', dataIndex: 'quantity', width: 100 },
    {
      title: '预估单价',
      dataIndex: 'estimatedPrice',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    { title: '备注', dataIndex: 'remark' },
  ]

  if (!detail) return null

  const s = statusMap[detail.status] || { text: detail.status, color: 'default' }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>

      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>采购需求详情 - {detail.requestNo}</span>
        <Space>
          {detail.status === 'draft' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/purchase-requests/edit/${id}`)}>
                编辑
              </Button>
              <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>
                提交审批
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered>
          <Descriptions.Item label="需求编号">{detail.requestNo}</Descriptions.Item>
          <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="项目名称">{detail.projectName}</Descriptions.Item>
          <Descriptions.Item label="申请部门">{detail.department}</Descriptions.Item>
          <Descriptions.Item label="申请人">{detail.requester?.realName}</Descriptions.Item>
          <Descriptions.Item label="总金额">
            <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
              ¥{Number(detail.totalAmount).toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="期望到货日期">
            {detail.deliveryDate ? new Date(detail.deliveryDate).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(detail.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="需求说明" span={3}>
            {detail.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="物料明细" style={{ marginBottom: 16 }}>
        <Table
          columns={itemColumns}
          dataSource={detail.items}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {detail.attachments && detail.attachments.length > 0 && (
        <Card title="附件列表" style={{ marginBottom: 16 }}>
          <List
            dataSource={detail.attachments}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" key="download">
                    <DownloadOutlined /> 下载
                  </a>
                ]}
              >
                <List.Item.Meta title={item.fileName} description={`${(item.fileSize / 1024).toFixed(1)} KB`} />
              </List.Item>
            )}
          />
        </Card>
      )}

      {detail.approvals && detail.approvals.length > 0 && (
        <Card title="审批记录" style={{ marginBottom: 16 }}>
          <Table
            dataSource={detail.approvals}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '审批层级', dataIndex: 'level', width: 100 },
              { title: '审批人', dataIndex: ['approver', 'realName'], width: 120 },
              { title: '角色', dataIndex: ['approver', 'role'], width: 120 },
              {
                title: '状态',
                dataIndex: 'status',
                width: 100,
                render: (v) => {
                  const map = {
                    pending: { text: '待审批', color: 'processing' },
                    approved: { text: '已通过', color: 'success' },
                    rejected: { text: '已驳回', color: 'error' },
                  }
                  const s = map[v] || { text: v, color: 'default' }
                  return <Tag color={s.color}>{s.text}</Tag>
                },
              },
              { title: '审批意见', dataIndex: 'comment' },
              {
                title: '审批时间',
                dataIndex: 'approvedAt',
                width: 180,
                render: (v) => v ? new Date(v).toLocaleString() : '-',
              },
            ]}
          />
        </Card>
      )}

      {detail.priceAlerts && detail.priceAlerts.length > 0 && (
        <Card title="价格波动提醒" style={{ marginBottom: 16 }}>
          <Table
            dataSource={detail.priceAlerts}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '物料名称', dataIndex: 'materialName' },
              {
                title: '历史价格',
                dataIndex: 'oldPrice',
                render: (v) => `¥${Number(v).toLocaleString()}`,
              },
              {
                title: '当前价格',
                dataIndex: 'newPrice',
                render: (v) => `¥${Number(v).toLocaleString()}`,
              },
              {
                title: '波动幅度',
                dataIndex: 'fluctuation',
                render: (v) => (
                  <span style={{ color: v > 0 ? '#f5222d' : '#52c41a' }}>
                    {v > 0 ? '+' : ''}{v}%
                  </span>
                ),
              },
              {
                title: '状态',
                dataIndex: 'isReviewed',
                render: (v) => v ? <Tag color="success">已复盘</Tag> : <Tag color="warning">待复盘</Tag>,
              },
            ]}
          />
        </Card>
      )}
    </div>
  )
}

export default PurchaseRequestDetail
