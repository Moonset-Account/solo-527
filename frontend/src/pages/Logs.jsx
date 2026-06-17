import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Tag,
  App,
  Card,
  DatePicker,
  Descriptions,
  Row,
  Col,
  Input,
} from 'antd'
import {
  FileTextOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { logApi } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker

const operationActions = ['CREATE', 'UPDATE', 'DELETE']
const operationModules = [
  'EQUIPMENT',
  'PROCESS',
  'WORK_ORDER',
  'PRODUCTION_PLAN',
  'PROCESS_FLOW',
  'UTILIZATION',
  'REWORK',
  'MATERIAL',
  'NOTIFICATION',
  'USER',
]

const Logs = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [actionFilter, setActionFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [operatorFilter, setOperatorFilter] = useState('')
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [actionFilter, moduleFilter, dateRange, operatorFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (actionFilter) params.action = actionFilter
      if (moduleFilter) params.module = moduleFilter
      if (operatorFilter) params.operatorName = operatorFilter
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await logApi.getList(params)
      if (res.code === 200) setData(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (record) => {
    try {
      const res = await logApi.getDetail(record.id)
      if (res.code === 200) {
        setDetail(res.data)
        setDetailVisible(true)
      }
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const getActionIcon = (action) => {
    const icons = {
      CREATE: <PlusOutlined style={{ color: '#52c41a' }} />,
      UPDATE: <EditOutlined style={{ color: '#1890ff' }} />,
      DELETE: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
    }
    return icons[action] || <FileTextOutlined />
  }

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'blue',
      DELETE: 'error',
    }
    return colors[action] || 'default'
  }

  const getActionText = (action) => {
    const texts = {
      CREATE: '新增',
      UPDATE: '修改',
      DELETE: '删除',
    }
    return texts[action] || action
  }

  const getModuleText = (module) => {
    const texts = {
      EQUIPMENT: '设备',
      PROCESS: '工序',
      WORK_ORDER: '工单',
      PRODUCTION_PLAN: '生产计划',
      PROCESS_FLOW: '工序流转',
      UTILIZATION: '设备稼动',
      REWORK: '返工',
      MATERIAL: '物料',
      NOTIFICATION: '通知',
      USER: '用户',
    }
    return texts[module] || module
  }

  const formatJson = (obj) => {
    if (!obj) return '-'
    try {
      return JSON.stringify(obj, null, 2)
    } catch (e) {
      return String(obj)
    }
  }

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (a) => (
        <Tag color={getActionColor(a)} icon={getActionIcon(a)}>
          {getActionText(a)}
        </Tag>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (m) => getModuleText(m),
    },
    {
      title: '操作内容',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Space>
            <FileTextOutlined />
            操作日志
          </Space>
        </h1>
        <Space>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Space>
            <FilterOutlined />
            <span>筛选：</span>
          </Space>
          <Select
            placeholder="操作类型"
            value={actionFilter || undefined}
            onChange={setActionFilter}
            style={{ width: 120 }}
            allowClear
          >
            {operationActions.map((a) => (
              <Option key={a} value={a}>
                {getActionText(a)}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="模块"
            value={moduleFilter || undefined}
            onChange={setModuleFilter}
            style={{ width: 120 }}
            allowClear
          >
            {operationModules.map((m) => (
              <Option key={m} value={m}>
                {getModuleText(m)}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="操作人"
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            style={{ width: 120 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 260 }}
          />
          <Button onClick={fetchData}>查询</Button>
          <Button
            onClick={() => {
              setActionFilter('')
              setModuleFilter('')
              setDateRange(null)
              setOperatorFilter('')
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="操作日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {detail && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作类型">
                <Tag color={getActionColor(detail.action)} icon={getActionIcon(detail.action)}>
                  {getActionText(detail.action)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="模块">{getModuleText(detail.module)}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detail.operatorName || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{detail.ipAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联ID" span={2}>
                {detail.recordId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作描述" span={2}>
                {detail.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作时间" span={2}>
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <Card
                  size="small"
                  title="变更前 (旧值)"
                  style={{ backgroundColor: '#fff2f0' }}
                >
                  <pre
                    style={{
                      maxHeight: 300,
                      overflow: 'auto',
                      margin: 0,
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {formatJson(detail.oldValue)}
                  </pre>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  title="变更后 (新值)"
                  style={{ backgroundColor: '#f6ffed' }}
                >
                  <pre
                    style={{
                      maxHeight: 300,
                      overflow: 'auto',
                      margin: 0,
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {formatJson(detail.newValue)}
                  </pre>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Logs
