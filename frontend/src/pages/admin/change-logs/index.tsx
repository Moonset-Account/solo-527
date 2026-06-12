import React, { useState, useEffect } from 'react'
import { Table, Card, Typography, Input, Form, Space, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { changeLog } from '@/api'
import { formatDate } from '@/utils'
import type { ChangeLog, PageParams } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography


const ChangeLogs: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ChangeLog[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [applicationId, setApplicationId] = useState<string>('')
  const [operatorName, setOperatorName] = useState<string>('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: PageParams & { applicationId?: number; operatorName?: string } = {
        ...pagination,
        ...(applicationId ? { applicationId: Number(applicationId) } : {}),
        ...(operatorName ? { operatorName } : {})
      }
      const result = await changeLog.list(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch change logs failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, applicationId, operatorName])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleReset = () => {
    setApplicationId('')
    setOperatorName('')
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const columns: ColumnsType<ChangeLog> = [
    {
      title: '变更ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span style={{ fontFamily: 'monospace' }}>#{id}</span>
    },
    {
      title: '申请ID',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 100,
      render: (id: number) => <span style={{ fontFamily: 'monospace' }}>#{id}</span>
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (text: string) => {
        const colorMap: Record<string, string> = {
          CREATE: 'blue',
          UPDATE: 'orange',
          SUBMIT: 'cyan',
          APPROVE: 'green',
          REJECT: 'red',
          RETURN: 'orange'
        }
        return <span style={{ color: colorMap[text] || '#666', fontWeight: 500 }}>{text}</span>
      }
    },
    {
      title: '字段',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 120
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'operatedAt',
      key: 'operatedAt',
      width: 160,
      render: (date: string) => formatDate(date)
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="申请ID">
            <Input
              placeholder="请输入申请ID"
              style={{ width: 150 }}
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item label="操作人">
            <Input
              placeholder="请输入操作人"
              style={{ width: 150 }}
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
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
          <Title level={4} style={{ margin: 0 }}>口径变更记录</Title>
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
    </div>
  )
}

export default ChangeLogs
