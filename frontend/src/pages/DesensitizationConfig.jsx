import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd'
import {
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { desensitizationApi } from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export default function DesensitizationConfig() {
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
      const result = await desensitizationApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载脱敏配置失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getMaskTypeColor = (type) => {
    switch (type) {
      case 'MASK_ALL': return 'red'
      case 'MASK_MIDDLE': return 'orange'
      case 'MASK_LOCAL': return 'blue'
      case 'ROUND': return 'green'
      case 'HASH': return 'purple'
      default: return 'default'
    }
  }

  const getMaskTypeText = (type) => {
    switch (type) {
      case 'MASK_ALL': return '全部掩码'
      case 'MASK_MIDDLE': return '中间掩码'
      case 'MASK_LOCAL': return '局部掩码'
      case 'ROUND': return '数值取整'
      case 'HASH': return '哈希脱敏'
      default: return type
    }
  }

  const getDataLevelColor = (level) => {
    switch (level) {
      case 'SENSITIVE': return 'red'
      case 'CONFIDENTIAL': return 'orange'
      case 'INTERNAL': return 'blue'
      case 'PUBLIC': return 'green'
      default: return 'default'
    }
  }

  const getDataLevelText = (level) => {
    switch (level) {
      case 'SENSITIVE': return '敏感'
      case 'CONFIDENTIAL': return '机密'
      case 'INTERNAL': return '内部'
      case 'PUBLIC': return '公开'
      default: return level
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ enabled: true, maskType: 'MASK_MIDDLE', dataLevel: 'INTERNAL' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await desensitizationApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await desensitizationApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await desensitizationApi.create(values)
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
      title: '数据集',
      dataIndex: 'datasetCode',
      key: 'datasetCode',
      render: (text) => <code>{text}</code>,
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
    },
    {
      title: '列名',
      dataIndex: 'columnName',
      key: 'columnName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '脱敏类型',
      dataIndex: 'maskType',
      key: 'maskType',
      render: (text) => <Tag color={getMaskTypeColor(text)}>{getMaskTypeText(text)}</Tag>,
      filters: [
        { text: '全部掩码', value: 'MASK_ALL' },
        { text: '中间掩码', value: 'MASK_MIDDLE' },
        { text: '局部掩码', value: 'MASK_LOCAL' },
        { text: '数值取整', value: 'ROUND' },
        { text: '哈希脱敏', value: 'HASH' },
      ],
      onFilter: (value, record) => record.maskType === value,
    },
    {
      title: '脱敏规则',
      dataIndex: 'maskRule',
      key: 'maskRule',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '数据级别',
      dataIndex: 'dataLevel',
      key: 'dataLevel',
      render: (text) => <Tag color={getDataLevelColor(text)}>{getDataLevelText(text)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (text) => (
        <Tag color={text ? 'green' : 'default'}>
          {text ? '启用' : '禁用'}
        </Tag>
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
            title="确定要删除这条脱敏配置吗？"
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
            <SafetyOutlined />
            数据脱敏配置
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增配置
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="datasetCode" label="数据集">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="tableName" label="表名">
            <Input placeholder="请输入" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="columnName" label="列名">
            <Input placeholder="请输入" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="maskType" label="脱敏类型">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="MASK_ALL">全部掩码</Option>
              <Option value="MASK_MIDDLE">中间掩码</Option>
              <Option value="MASK_LOCAL">局部掩码</Option>
              <Option value="ROUND">数值取整</Option>
              <Option value="HASH">哈希脱敏</Option>
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
        title={editingRecord ? '编辑脱敏配置' : '新增脱敏配置'}
        width={600}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="datasetCode"
            label="数据集编码"
            rules={[{ required: true, message: '请输入数据集编码' }]}
          >
            <Input placeholder="例如：user_growth_daily" />
          </Form.Item>
          <Form.Item
            name="tableName"
            label="表名"
            rules={[{ required: true, message: '请输入表名' }]}
          >
            <Input placeholder="例如：user_profile" />
          </Form.Item>
          <Form.Item
            name="columnName"
            label="列名"
            rules={[{ required: true, message: '请输入列名' }]}
          >
            <Input placeholder="例如：phone、id_card" />
          </Form.Item>
          <Form.Item
            name="maskType"
            label="脱敏类型"
            rules={[{ required: true, message: '请选择脱敏类型' }]}
          >
            <Select>
              <Option value="MASK_ALL">全部掩码 - 全部替换为 *</Option>
              <Option value="MASK_MIDDLE">中间掩码 - 手机号、身份证等中间部分</Option>
              <Option value="MASK_LOCAL">局部掩码 - 指定位置掩码</Option>
              <Option value="ROUND">数值取整 - 数值类数据取整</Option>
              <Option value="HASH">哈希脱敏 - 不可逆哈希处理</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="maskRule"
            label="脱敏规则"
          >
            <TextArea rows={3} placeholder="例如：中间4位掩码、保留前3后4、保留2位小数等" />
          </Form.Item>
          <Form.Item
            name="dataLevel"
            label="数据级别"
            rules={[{ required: true, message: '请选择数据级别' }]}
          >
            <Select>
              <Option value="SENSITIVE">敏感 - 最高级别，完全脱敏</Option>
              <Option value="CONFIDENTIAL">机密 - 高管才能查看原始数据</Option>
              <Option value="INTERNAL">内部 - 经理以上可查看原始数据</Option>
              <Option value="PUBLIC">公开 - 无需脱敏</Option>
            </Select>
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
