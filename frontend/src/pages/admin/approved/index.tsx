import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Typography, Select, Input, Form, Drawer, Descriptions, List, Timeline, message } from 'antd'
import { EyeOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { application, attachment } from '@/api'
import { formatDate, formatMoney } from '@/utils'
import type { ExpenseApplication, ApplicationStatus, PageParams, ApprovalRecord, ExpenseAttachment } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING: { text: '审批中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
}

const Approved: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExpenseApplication[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [status, setStatus] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ExpenseApplication | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: PageParams & { status?: string; keyword?: string } = {
        ...pagination,
        ...(status ? { status } : {}),
        ...(keyword ? { keyword } : {})
      }
      const result = await application.list(params)
      setData(result.list.filter(app => app.status === 'APPROVED' || app.status === 'REJECTED'))
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch approved applications failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, status, keyword])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleReset = () => {
    setStatus('')
    setKeyword('')
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleViewDetail = async (record: ExpenseApplication) => {
    try {
      const detail = await application.getById(record.id)
      setSelectedRecord(detail)
      setDrawerVisible(true)
    } catch (error) {
      console.error('Fetch application detail failed:', error)
    }
  }

  const handleDownload = async (att: ExpenseAttachment) => {
    try {
      const blob = await attachment.download(att.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = att.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      message.error('下载失败')
    }
  }

  const columns: ColumnsType<ExpenseApplication> = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 150,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(amount)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ApplicationStatus) => {
        const { text, color } = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={color as any}>{text}</Tag>
      }
    },
    {
      title: '审批时间',
      dataIndex: 'approvedAt',
      key: 'approvedAt',
      width: 160,
      render: (date?: string) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              style={{ width: 150 }}
              value={status || undefined}
              onChange={value => setStatus(value || '')}
              allowClear
            >
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item label="关键词">
            <Input
              placeholder="搜索标题/编号"
              style={{ width: 200 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>已审批</Title>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Drawer
        title="申请详情"
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedRecord && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedRecord.title}</Title>
                <Text type="secondary" style={{ fontFamily: 'monospace' }}>编号: {selectedRecord.applicationNo}</Text>
              </div>
              <Tag color={statusMap[selectedRecord.status].color as any}>{statusMap[selectedRecord.status].text}</Tag>
            </div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请人">{selectedRecord.applicantName}</Descriptions.Item>
              <Descriptions.Item label="部门">{selectedRecord.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">{selectedRecord.expenseType}</Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(selectedRecord.amount)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">{selectedRecord.submittedAt ? formatDate(selectedRecord.submittedAt) : '-'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">{selectedRecord.approvedAt ? formatDate(selectedRecord.approvedAt) : '-'}</Descriptions.Item>
              <Descriptions.Item label="费用说明" span={2}>{selectedRecord.description}</Descriptions.Item>
            </Descriptions>
            <Card title="附件列表" size="small" style={{ marginBottom: 16 }}>
              {selectedRecord.attachments.length === 0 ? (
                <Text type="secondary">暂无附件</Text>
              ) : (
                <List
                  size="small"
                  dataSource={selectedRecord.attachments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)}>下载</Button>
                      ]}
                    >
                      <List.Item.Meta title={item.fileName} />
                    </List.Item>
                  )}
                />
              )}
            </Card>
            <Card title="审批记录" size="small">
              {selectedRecord.approvalRecords.length === 0 ? (
                <Text type="secondary">暂无审批记录</Text>
              ) : (
                <Timeline
                  items={selectedRecord.approvalRecords.map((record: ApprovalRecord) => ({
                    color: record.action === 'APPROVE' ? 'green' : record.action === 'REJECT' ? 'red' : 'orange',
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {record.nodeName} - {record.approverName}
                          <Tag color={record.action === 'APPROVE' ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                            {record.action === 'APPROVE' ? '同意' : '拒绝'}
                          </Tag>
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>{record.comment || '无意见'}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>{formatDate(record.approvedAt)}</div>
                      </div>
                    )
                  }))}
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Approved
