import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Tag, Space, message } from 'antd'
import { EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getBatchLogs, getBatchDetail } from '../../services/api'

const BatchLogs = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState(null)
  const [detailData, setDetailData] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailPage, setDetailPage] = useState(1)
  const [detailTotal, setDetailTotal] = useState(0)
  const navigate = useNavigate()

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getBatchLogs({ page, pageSize })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleViewDetail = async (record, page = 1) => {
    setCurrentLog(record)
    setDetailVisible(true)
    setDetailLoading(true)
    setDetailPage(page)
    try {
      const res = await getBatchDetail(record.id, { page, pageSize: 10 })
      setDetailData(res.details || [])
      setDetailTotal(res.total || 0)
    } finally {
      setDetailLoading(false)
    }
  }

  const columns = [
    { title: '批次号', dataIndex: 'batchNo', width: 200 },
    { title: '操作类型', dataIndex: 'operation', width: 150 },
    { title: '操作范围', dataIndex: 'scopeNote', ellipsis: true },
    { title: '总记录数', dataIndex: 'totalCount', width: 100 },
    {
      title: '成功数',
      dataIndex: 'successCount',
      width: 100,
      render: (v) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '失败数',
      dataIndex: 'failCount',
      width: 100,
      render: (v) => v > 0 ? <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{v}</span> : v,
    },
    { title: '操作时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  const detailColumns = [
    { title: '记录ID', dataIndex: 'recordId', width: 100 },
    {
      title: '状态',
      dataIndex: 'success',
      width: 100,
      render: (v) => v ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
    },
    {
      title: '错误字段',
      dataIndex: 'errorFields',
      render: (v) => {
        if (!v) return '-'
        if (typeof v === 'object') {
          return (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
              {Object.entries(v).map(([k, val]) => (
                <li key={k} style={{ color: '#f5222d' }}>
                  <strong>{k}:</strong> {val}
                </li>
              ))}
            </ul>
          )
        }
        return String(v)
      },
    },
    { title: '错误信息', dataIndex: 'errorMessage' },
  ]

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/batch')}>返回</Button>
          <span>批量操作日志</span>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
      />

      <Modal
        title={`批次详情 - ${currentLog?.batchNo}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentLog && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <span><strong>操作：</strong>{currentLog.operation}</span>
              <span><strong>总数：</strong>{currentLog.totalCount}</span>
              <span style={{ color: '#52c41a' }}><strong>成功：</strong>{currentLog.successCount}</span>
              <span style={{ color: '#f5222d' }}><strong>失败：</strong>{currentLog.failCount}</span>
            </div>
            <Table
              columns={detailColumns}
              dataSource={detailData}
              rowKey="id"
              loading={detailLoading}
              size="small"
              pagination={{
                current: detailPage,
                pageSize: 10,
                total: detailTotal,
                onChange: (page) => handleViewDetail(currentLog, page),
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BatchLogs
