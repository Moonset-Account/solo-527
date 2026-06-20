import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd'
import {
  AppstoreOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { dimensionApi } from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export default function DimensionConfig() {
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
      const result = await dimensionApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载维度配置失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'CATEGORY': return 'blue'
      case 'DATE': return 'green'
      case 'NUMERIC': return 'orange'
      case 'BOOLEAN': return 'purple'
      default: return 'default'
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'CATEGORY': return '分类'
      case 'DATE': return '日期'
      case 'NUMERIC': return '数值'
      case 'BOOLEAN': return '布尔'
      default: return type
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ enabled: true, dimensionType: 'CATEGORY' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await dimensionApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleToggle = async (record, enabled) => {
    try {
      await dimensionApi.toggle(record.id, enabled)
      message.success(enabled ? '已启用' : '已禁用')
      loadData()
    } catch (error) {
      console.error('切换状态失败', error)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await dimensionApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await dimensionApi.create(values)
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
      title: '维度编码',
      dataIndex: 'dimensionCode',
      key: 'dimensionCode',
      render: (text) => <code>{text}</code>,
    },
    {
      title: '维度名称',
      dataIndex: 'dimensionName',
      key: 'dimensionName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '维度类型',
      dataIndex: 'dimensionType',
      key: 'dimensionType',
      render: (text) => <Tag color={getTypeColor(text)}>{getTypeText(text)}</Tag>,
      filters: [
        { text: '分类', value: 'CATEGORY' },
        { text: '日期', value: 'DATE' },
        { text: '数值', value: 'NUMERIC' },
        { text: '布尔', value: 'BOOLEAN' },
      ],
      onFilter: (value, record) => record.dimensionType === value,
    },
    {
      title: '维度值',
      dataIndex: 'dimensionValues',
      key: 'dimensionValues',
      render: (text) => {
        if (!text) return '-'
        const values = Array.isArray(text) ? text : JSON.parse(text || '[]')
        return (
          <Space wrap>
            {values.slice(0, 5).map((v, i) => (
              <Tag key={i} color="geekblue">{v}</Tag>
            ))}
            {values.length > 5 && <Tag>+{values.length - 5}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '生效条件',
      dataIndex: 'effectiveCondition',
      key: 'effectiveCondition',
      ellipsis: true,
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
            title="确定要删除这个维度吗？"
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
            <AppstoreOutlined />
            维度配置
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增维度
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="dimensionCode" label="维度编码">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dimensionName" label="维度名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dimensionType" label="维度类型">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="CATEGORY">分类</Option>
              <Option value="DATE">日期</Option>
              <Option value="NUMERIC">数值</Option>
              <Option value="BOOLEAN">布尔</Option>
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
          scroll={{ x: 1200 }}
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
        title={editingRecord ? '编辑维度' : '新增维度'}
        width={600}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="dimensionCode"
            label="维度编码"
            rules={[{ required: true, message: '请输入维度编码' }]}
          >
            <Input placeholder="例如：region、channel" />
          </Form.Item>
          <Form.Item
            name="dimensionName"
            label="维度名称"
            rules={[{ required: true, message: '请输入维度名称' }]}
          >
            <Input placeholder="例如：地区、渠道" />
          </Form.Item>
          <Form.Item
            name="dimensionType"
            label="维度类型"
            rules={[{ required: true, message: '请选择维度类型' }]}
          >
            <Select>
              <Option value="CATEGORY">分类</Option>
              <Option value="DATE">日期</Option>
              <Option value="NUMERIC">数值</Option>
              <Option value="BOOLEAN">布尔</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dimensionValues"
            label="维度值（JSON数组格式）"
          >
            <TextArea rows={3} placeholder='例如：["华东","华北","华南"]' />
          </Form.Item>
          <Form.Item
            name="effectiveCondition"
            label="生效条件"
          >
            <TextArea rows={3} placeholder="例如：用户增长数据集专用" />
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
