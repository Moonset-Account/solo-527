import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd'
import {
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { datasetApi } from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export default function DatasetPermissions() {
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
      const result = await datasetApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载数据集权限失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getPermissionTypeColor = (type) => {
    switch (type) {
      case 'READ': return 'green'
      case 'WRITE': return 'blue'
      case 'ADMIN': return 'purple'
      default: return 'default'
    }
  }

  const getPermissionTypeText = (type) => {
    switch (type) {
      case 'READ': return '只读'
      case 'WRITE': return '读写'
      case 'ADMIN': return '管理'
      default: return type
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ enabled: true, permissionType: 'READ' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await datasetApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleToggle = async (record, enabled) => {
    try {
      await datasetApi.toggle(record.id, enabled)
      message.success(enabled ? '已启用' : '已禁用')
      loadData()
    } catch (error) {
      console.error('切换状态失败', error)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await datasetApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await datasetApi.create(values)
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
      title: '数据集编码',
      dataIndex: 'datasetCode',
      key: 'datasetCode',
      render: (text) => <code>{text}</code>,
    },
    {
      title: '数据集名称',
      dataIndex: 'datasetName',
      key: 'datasetName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text, record) => text || `角色ID: ${record.roleId}`,
    },
    {
      title: '权限类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      render: (text) => <Tag color={getPermissionTypeColor(text)}>{getPermissionTypeText(text)}</Tag>,
      filters: [
        { text: '只读', value: 'READ' },
        { text: '读写', value: 'WRITE' },
        { text: '管理', value: 'ADMIN' },
      ],
      onFilter: (value, record) => record.permissionType === value,
    },
    {
      title: '行过滤条件',
      dataIndex: 'rowFilterCondition',
      key: 'rowFilterCondition',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '列脱敏配置',
      dataIndex: 'columnMaskConfig',
      key: 'columnMaskConfig',
      ellipsis: true,
      render: (text) => {
        if (!text) return '-'
        const config = typeof text === 'string' ? JSON.parse(text) : text
        const count = Object.keys(config).length
        return <Tag color="orange">{count} 列需脱敏</Tag>
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
            title="确定要删除这条权限吗？"
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
            <DatabaseOutlined />
            数据集权限配置
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增权限
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="datasetCode" label="数据集编码">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="datasetName" label="数据集名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="permissionType" label="权限类型">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="READ">只读</Option>
              <Option value="WRITE">读写</Option>
              <Option value="ADMIN">管理</Option>
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
          scroll={{ x: 1400 }}
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
        title={editingRecord ? '编辑数据集权限' : '新增数据集权限'}
        width={700}
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
            name="datasetName"
            label="数据集名称"
            rules={[{ required: true, message: '请输入数据集名称' }]}
          >
            <Input placeholder="例如：用户增长日报表" />
          </Form.Item>
          <Form.Item
            name="roleId"
            label="角色ID"
            rules={[{ required: true, message: '请输入角色ID' }]}
          >
            <Input type="number" placeholder="例如：1" />
          </Form.Item>
          <Form.Item
            name="roleName"
            label="角色名称"
          >
            <Input placeholder="例如：运营负责人" />
          </Form.Item>
          <Form.Item
            name="permissionType"
            label="权限类型"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select>
              <Option value="READ">只读</Option>
              <Option value="WRITE">读写</Option>
              <Option value="ADMIN">管理</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rowFilterCondition"
            label="行过滤条件"
          >
            <TextArea rows={3} placeholder="例如：region IN ('华东','华北')" />
          </Form.Item>
          <Form.Item
            name="columnMaskConfig"
            label="列脱敏配置（JSON格式）"
          >
            <TextArea rows={3} placeholder='例如：{"phone": "MASK_MIDDLE", "id_card": "MASK_ALL"}' />
          </Form.Item>
          <Form.Item
            name="effectiveCondition"
            label="生效条件"
          >
            <TextArea rows={3} placeholder="例如：仅工作日 09:00-18:00 生效" />
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
