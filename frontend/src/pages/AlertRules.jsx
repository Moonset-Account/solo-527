import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd'
import {
  AlertOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { alertApi } from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export default function AlertRules() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
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
      const result = await alertApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载告警规则失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'red'
      case 'HIGH': return 'orange'
      case 'MEDIUM': return 'gold'
      default: return 'blue'
    }
  }

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '严重'
      case 'HIGH': return '高'
      case 'MEDIUM': return '中'
      default: return '低'
    }
  }

  const getAlertTypeText = (type) => {
    switch (type) {
      case 'THRESHOLD': return '阈值告警'
      case 'TREND': return '趋势告警'
      case 'FLUCTUATION': return '波动告警'
      default: return type
    }
  }

  const getOperatorText = (op) => {
    switch (op) {
      case 'GT': return '>'
      case 'LT': return '<'
      case 'GTE': return '>='
      case 'LTE': return '<='
      case 'EQ': return '='
      case 'NE': return '!='
      default: return op
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ enabled: true, severity: 'MEDIUM', operator: 'GT', alertType: 'THRESHOLD' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await alertApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleToggle = async (record, enabled) => {
    try {
      await alertApi.toggle(record.id, enabled)
      message.success(enabled ? '已启用' : '已禁用')
      loadData()
    } catch (error) {
      console.error('切换状态失败', error)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await alertApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await alertApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('提交失败', error)
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '监控指标',
      dataIndex: 'metricName',
      key: 'metricName',
    },
    {
      title: '告警类型',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (text) => <Tag color="blue">{getAlertTypeText(text)}</Tag>,
      filters: [
        { text: '阈值告警', value: 'THRESHOLD' },
        { text: '趋势告警', value: 'TREND' },
        { text: '波动告警', value: 'FLUCTUATION' },
      ],
      onFilter: (value, record) => record.alertType === value,
    },
    {
      title: '告警条件',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (text, record) => (
        <span>
          {getOperatorText(record.operator)} {text}
        </span>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (text) => <Tag color={getSeverityColor(text)}>{getSeverityText(text)}</Tag>,
    },
    {
      title: '生效条件',
      dataIndex: 'effectiveCondition',
      key: 'effectiveCondition',
      ellipsis: true,
    },
    {
      title: '通知渠道',
      dataIndex: 'notifyChannel',
      key: 'notifyChannel',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (text, record) => (
        <Switch
          checked={text}
          onChange={(checked) => handleToggle(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <AlertOutlined />
            告警规则配置
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增规则
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="ruleName" label="规则名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="metricName" label="监控指标">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="alertType" label="告警类型">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="THRESHOLD">阈值告警</Option>
              <Option value="TREND">趋势告警</Option>
              <Option value="FLUCTUATION">波动告警</Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="CRITICAL">严重</Option>
              <Option value="HIGH">高</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="LOW">低</Option>
            </Select>
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

      <Modal
        title={editingRecord ? '编辑告警规则' : '新增告警规则'}
        width={600}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="ruleName"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item
            name="metricName"
            label="监控指标"
            rules={[{ required: true, message: '请输入监控指标' }]}
          >
            <Input placeholder="例如：日活用户、新增用户数" />
          </Form.Item>
          <Form.Item
            name="alertType"
            label="告警类型"
            rules={[{ required: true, message: '请选择告警类型' }]}
          >
            <Select>
              <Option value="THRESHOLD">阈值告警</Option>
              <Option value="TREND">趋势告警</Option>
              <Option value="FLUCTUATION">波动告警</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="operator"
            label="比较运算符"
            rules={[{ required: true, message: '请选择比较运算符' }]}
          >
            <Select>
              <Option value="GT">{'>'} (大于)</Option>
              <Option value="LT">{'<'} (小于)</Option>
              <Option value="GTE">{'>='} (大于等于)</Option>
              <Option value="LTE">{'<='} (小于等于)</Option>
              <Option value="EQ">{'='} (等于)</Option>
              <Option value="NE">{'!='} (不等于)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="threshold"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <Input type="number" placeholder="请输入阈值" />
          </Form.Item>
          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select>
              <Option value="CRITICAL">严重</Option>
              <Option value="HIGH">高</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="LOW">低</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="effectiveCondition"
            label="生效条件"
          >
            <TextArea rows={3} placeholder="例如：工作日 09:00-18:00 生效" />
          </Form.Item>
          <Form.Item
            name="notifyChannel"
            label="通知渠道"
          >
            <Input placeholder="例如：邮件、企业微信、钉钉" />
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
