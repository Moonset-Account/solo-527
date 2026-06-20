import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import {
  getExceptionList,
  resolveException,
} from '../api/exception'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const statusMap = {
  PENDING: { text: '待处理', color: 'warning' },
  PROCESSING: { text: '处理中', color: 'processing' },
  RESOLVED: { text: '已解决', color: 'success' },
  CLOSED: { text: '已关闭', color: 'default' },
}

const priorityMap = {
  HIGH: { text: '高', color: 'red' },
  MEDIUM: { text: '中', color: 'orange' },
  LOW: { text: '低', color: 'blue' },
}

const typeMap = {
  FOLLOW_OVERDUE: '跟进超时',
  QUOTATION_DELAY: '报价延迟',
  CUSTOMER_COMPLAINT: '客户投诉',
  QUALITY_ISSUE: '质量问题',
  OTHER: '其他',
}

const ExceptionList = () => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [resolveForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        pageNum: page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      }
      const res = await getExceptionList(params)
      setData(res.records || [])
      setPagination({
        current: res.current,
        pageSize: res.size,
        total: res.total,
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const openDetailDrawer = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const openResolveModal = (record) => {
    setCurrentItem(record)
    setResolveModalVisible(true)
  }

  const handleResolve = async (values) => {
    try {
      await resolveException(currentItem.id, values.overdueReason, values.handlingCostMinutes)
      message.success('已解决')
      setResolveModalVisible(false)
      resolveForm.resetFields()
      loadData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const columns = [
    {
      title: '异常标题',
      dataIndex: 'title',
      width: 200,
      render: (text, record) => (
        <a onClick={() => openDetailDrawer(record)}>{text}</a>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      width: 120,
      render: (type) => typeMap[type] || type,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      width: 120,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (priority) => {
        const info = priorityMap[priority] || { text: priority, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '责任人',
      dataIndex: 'responsibleName',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '处理耗时',
      dataIndex: 'handlingCostMinutes',
      width: 100,
      render: (val) => val ? `${val}分钟` : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
            查看
          </Button>
          {record.status !== 'RESOLVED' && record.status !== 'CLOSED' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openResolveModal(record)}>
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>异常记录</h2>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索标题/客户"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={() => { setKeyword(''); setStatusFilter(''); loadData(1, pagination.pageSize) }}>
            重置
          </Button>
        </Space>
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <Drawer
        title="异常详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentItem && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="标题">{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeMap[currentItem.exceptionType] || currentItem.exceptionType}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                {priorityMap[currentItem.priority]?.text || currentItem.priority}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {statusMap[currentItem.status]?.text || currentItem.status}
              </Descriptions.Item>
              <Descriptions.Item label="客户">{currentItem.customerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任人">{currentItem.responsibleName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentItem.handlerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理耗时">{currentItem.handlingCostMinutes ? `${currentItem.handlingCostMinutes}分钟` : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {currentItem.createdAt ? dayjs(currentItem.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {currentItem.resolvedAt ? dayjs(currentItem.resolvedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            {currentItem.description && (
              <div style={{ marginTop: 16 }}>
                <h4>描述</h4>
                <p>{currentItem.description}</p>
              </div>
            )}
            {currentItem.overdueReason && (
              <div style={{ marginTop: 16 }}>
                <h4>超时原因</h4>
                <p>{currentItem.overdueReason}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="处理异常"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="overdueReason"
            label="超时原因/处理说明"
            rules={[{ required: true, message: '请输入处理说明' }]}
          >
            <TextArea rows={4} placeholder="请输入超时原因或处理说明" />
          </Form.Item>
          <Form.Item name="handlingCostMinutes" label="处理耗时(分钟)">
            <Input type="number" placeholder="请输入处理耗时" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认解决</Button>
              <Button onClick={() => setResolveModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ExceptionList
