import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Drawer, Descriptions, message, Popconfirm } from 'antd'
import {
  CheckSquareOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { approvalApi } from '@/services/api'
import dayjs from 'dayjs'
import FilterTemplateManager from '@/components/FilterTemplateManager'

const { Option } = Select
const { TextArea } = Input

export default function ApprovalList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [approveVisible, setApproveVisible] = useState(false)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [addVisible, setAddVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [approveForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [filters, setFilters] = useState({})
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current - 1,
        size: pagination.pageSize,
        ...filters,
      }
      const result = await approvalApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载审批列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'DATA_PERMISSION': return 'blue'
      case 'DATA_EXPORT': return 'green'
      case 'DESENSITIZATION_BYPASS': return 'orange'
      case 'REPORT_ACCESS': return 'purple'
      default: return 'default'
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'DATA_PERMISSION': return '数据权限申请'
      case 'DATA_EXPORT': return '数据导出申请'
      case 'DESENSITIZATION_BYPASS': return '脱敏豁免申请'
      case 'REPORT_ACCESS': return '报表访问申请'
      default: return type
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'APPROVED': return 'green'
      case 'REJECTED': return 'red'
      case 'EXPIRED': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return '待审批'
      case 'APPROVED': return '已通过'
      case 'REJECTED': return '已拒绝'
      case 'EXPIRED': return '已过期'
      default: return status
    }
  }

  const handleViewDetail = async (record) => {
    try {
      const detail = await approvalApi.getDetail(record.id)
      setCurrentRecord(detail)
      setDetailVisible(true)
    } catch (error) {
      console.error('获取审批详情失败', error)
    }
  }

  const handleApproveClick = (record) => {
    setCurrentRecord(record)
    approveForm.resetFields()
    setApproveVisible(true)
  }

  const handleRejectClick = (record) => {
    setCurrentRecord(record)
    rejectForm.resetFields()
    setRejectVisible(true)
  }

  const handleApprove = async (values) => {
    try {
      await approvalApi.approve(currentRecord.id, values)
      message.success('审批通过')
      setApproveVisible(false)
      loadData()
    } catch (error) {
      console.error('审批失败', error)
    }
  }

  const handleReject = async (values) => {
    try {
      await approvalApi.reject(currentRecord.id, values)
      message.success('已拒绝')
      setRejectVisible(false)
      loadData()
    } catch (error) {
      console.error('拒绝失败', error)
    }
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddVisible(true)
  }

  const handleAddSubmit = async (values) => {
    try {
      await approvalApi.create(values)
      message.success('申请已提交')
      setAddVisible(false)
      loadData()
    } catch (error) {
      console.error('提交申请失败', error)
    }
  }

  const handleSearch = (values) => {
    setFilters(values)
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleApplyTemplate = (conditions) => {
    searchForm.setFieldsValue(conditions)
    setFilters(conditions)
    setPagination({ ...pagination, current: 1 })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '申请类型',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (text) => <Tag color={getTypeColor(text)}>{getTypeText(text)}</Tag>,
      filters: [
        { text: '数据权限申请', value: 'DATA_PERMISSION' },
        { text: '数据导出申请', value: 'DATA_EXPORT' },
        { text: '脱敏豁免申请', value: 'DESENSITIZATION_BYPASS' },
        { text: '报表访问申请', value: 'REPORT_ACCESS' },
      ],
      onFilter: (value, record) => record.requestType === value,
    },
    {
      title: '申请目标',
      dataIndex: 'target',
      key: 'target',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
    },
    {
      title: '审批人',
      dataIndex: 'approverName',
      key: 'approverName',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
      filters: [
        { text: '待审批', value: 'PENDING' },
        { text: '已通过', value: 'APPROVED' },
        { text: '已拒绝', value: 'REJECTED' },
        { text: '已过期', value: 'EXPIRED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '有效期',
      dataIndex: 'validFrom',
      key: 'validFrom',
      render: (text, record) => {
        if (!text && !record.validTo) return '-'
        return (
          <span>
            {text ? dayjs(text).format('YYYY-MM-DD') : '-'}
            {' ~ '}
            {record.validTo ? dayjs(record.validTo).format('YYYY-MM-DD') : '-'}
          </span>
        )
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
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
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApproveClick(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                danger
                onClick={() => handleRejectClick(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <CheckSquareOutlined />
            权限审批管理
          </Space>
        }
        extra={
          <Space>
            <FilterTemplateManager
              pageCode="approval_list"
              currentFilters={filters}
              onApplyTemplate={handleApplyTemplate}
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建申请
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="requestType" label="申请类型">
            <Select placeholder="请选择" allowClear style={{ width: 150 }}>
              <Option value="DATA_PERMISSION">数据权限申请</Option>
              <Option value="DATA_EXPORT">数据导出申请</Option>
              <Option value="DESENSITIZATION_BYPASS">脱敏豁免申请</Option>
              <Option value="REPORT_ACCESS">报表访问申请</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="PENDING">待审批</Option>
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
              <Option value="EXPIRED">已过期</Option>
            </Select>
          </Form.Item>
          <Form.Item name="applicantName" label="申请人">
            <Input placeholder="请输入" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      <Drawer
        title="审批详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="申请类型">
              <Tag color={getTypeColor(currentRecord.requestType)}>
                {getTypeText(currentRecord.requestType)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申请目标">{currentRecord.target}</Descriptions.Item>
            <Descriptions.Item label="申请理由">{currentRecord.justification || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请人">{currentRecord.applicantName}</Descriptions.Item>
            <Descriptions.Item label="审批人">{currentRecord.approverName || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(currentRecord.status)}>
                {getStatusText(currentRecord.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="审批意见">{currentRecord.approvalComment || '-'}</Descriptions.Item>
            <Descriptions.Item label="有效期">
              {currentRecord.validFrom ? dayjs(currentRecord.validFrom).format('YYYY-MM-DD') : '-'}
              {' ~ '}
              {currentRecord.validTo ? dayjs(currentRecord.validTo).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="审批时间">
              {currentRecord.approvedAt ? dayjs(currentRecord.approvedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="通过审批"
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={null}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
          <Form.Item
            name="approvalComment"
            label="审批意见"
          >
            <TextArea rows={3} placeholder="请输入审批意见（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认通过
              </Button>
              <Button onClick={() => setApproveVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝申请"
        open={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="approvalComment"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea rows={3} placeholder="请详细说明拒绝原因" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                确认拒绝
              </Button>
              <Button onClick={() => setRejectVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建审批申请"
        width={600}
        open={addVisible}
        onCancel={() => setAddVisible(false)}
        footer={null}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit}>
          <Form.Item
            name="requestType"
            label="申请类型"
            rules={[{ required: true, message: '请选择申请类型' }]}
          >
            <Select>
              <Option value="DATA_PERMISSION">数据权限申请</Option>
              <Option value="DATA_EXPORT">数据导出申请</Option>
              <Option value="DESENSITIZATION_BYPASS">脱敏豁免申请</Option>
              <Option value="REPORT_ACCESS">报表访问申请</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="申请目标"
            rules={[{ required: true, message: '请输入申请目标' }]}
          >
            <Input placeholder="例如：用户增长日报表、用户手机号字段" />
          </Form.Item>
          <Form.Item
            name="justification"
            label="申请理由"
            rules={[{ required: true, message: '请输入申请理由' }]}
          >
            <TextArea rows={3} placeholder="请详细说明申请理由" />
          </Form.Item>
          <Form.Item label="有效期">
            <Space>
              <Form.Item name="validFrom" noStyle>
                <Input type="date" placeholder="开始日期" />
              </Form.Item>
              <span>至</span>
              <Form.Item name="validTo" noStyle>
                <Input type="date" placeholder="结束日期" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交申请
              </Button>
              <Button onClick={() => setAddVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
