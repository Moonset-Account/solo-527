import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Select,
  Form,
  Button,
  Space,
  Input,
  Tag,
  DatePicker,
} from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { operationLogApi } from '../api'

const { RangePicker } = DatePicker
const { Option } = Select

const operationTypeMap = {
  CREATE: { text: '创建', color: 'blue' },
  UPDATE: { text: '更新', color: 'default' },
  SUBMIT: { text: '提交', color: 'blue' },
  APPROVE: { text: '通过', color: 'green' },
  REJECT: { text: '驳回', color: 'red' },
  ASSIGN: { text: '分配', color: 'purple' },
  MERGE: { text: '合并', color: 'cyan' },
  DELAY: { text: '延期', color: 'orange' },
  CLOSE: { text: '关闭', color: 'default' },
  EXPORT: { text: '导出', color: 'geekblue' },
  STUCK: { text: '卡住', color: 'warning' },
  COMMENT: { text: '评论', color: 'default' },
}

const OperationLogs = () => {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        operationType: values.operationType || undefined,
        operatorId: values.operatorId && values.operatorId !== '' ? Number(values.operatorId) : undefined,
        requirementId: values.requirementId && values.requirementId !== '' ? Number(values.requirementId) : undefined,
      }

      const result = await operationLogApi.search(
        params,
        pagination.current - 1,
        pagination.pageSize
      )
      setData(result.content)
      setPagination({
        ...pagination,
        total: result.totalElements,
      })
    } catch (error) {
      console.error('获取操作日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    form.resetFields()
    setPagination({ current: 1, pageSize: 20, total: 0 })
    setTimeout(() => {
      fetchData()
    }, 0)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 100,
      render: (type) => {
        const info = operationTypeMap[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '关联需求',
      dataIndex: 'requirementId',
      key: 'requirementId',
      width: 100,
      render: (id) => id || '-',
    },
    {
      title: '节点ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
      width: 90,
      render: (id) => id || '-',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: '状态变更',
      key: 'status',
      width: 180,
      render: (_, record) => (
        <span>
          {record.beforeStatus && (
            <>
              <Tag color="default" style={{ marginRight: 4 }}>
                {record.beforeStatus}
              </Tag>
              <span style={{ marginRight: 4 }}>→</span>
            </>
          )}
          {record.afterStatus && <Tag color="blue">{record.afterStatus}</Tag>}
          {!record.beforeStatus && !record.afterStatus && '-'}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (remark) => remark || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      fixed: 'right',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div className="page-container">
      <div className="table-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          操作日志
        </h2>
      </div>

      <Form form={form} layout="inline" className="filter-bar">
        <Form.Item name="operationType" label="操作类型">
          <Select placeholder="全部类型" style={{ width: 140 }} allowClear>
            {Object.entries(operationTypeMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="operatorId" label="操作人ID">
          <Input placeholder="操作人ID" style={{ width: 140 }} allowClear />
        </Form.Item>
        <Form.Item name="requirementId" label="需求ID">
          <Input placeholder="需求ID" style={{ width: 120 }} allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={(pag) => {
          setPagination(pag)
          setTimeout(fetchData, 0)
        }}
        scroll={{ x: 1300 }}
      />
    </div>
  )
}

export default OperationLogs
