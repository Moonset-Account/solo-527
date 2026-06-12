import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Typography, Modal, Form, Input, message, Tabs, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { config } from '@/api'
import { formatDate } from '@/utils'
import type { ApprovalConfig, CreateConfigRequest, UpdateConfigRequest } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

const { TextArea } = Input

interface ConfigItem extends ApprovalConfig {
  category: 'attachment' | 'returnReason' | 'resource'
}

const Config: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConfigItem[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ApprovalConfig | null>(null)
  const [activeTab, setActiveTab] = useState('attachment')
  const [form] = Form.useForm<CreateConfigRequest & { id?: number }>()

  const categoryConfig = {
    attachment: {
      title: '附件配置',
      description: '配置附件相关参数，如最大上传大小、允许的文件类型等',
      keyPrefix: 'attachment_'
    },
    returnReason: {
      title: '退回原因配置',
      description: '配置申请退回时的可选原因',
      keyPrefix: 'return_reason_'
    },
    resource: {
      title: '资源占用配置',
      description: '配置系统资源占用相关参数',
      keyPrefix: 'resource_'
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await config.list()
      const categorized: ConfigItem[] = result.map(item => {
        let category: ConfigItem['category'] = 'attachment'
        if (item.configKey.startsWith('return_reason_')) {
          category = 'returnReason'
        } else if (item.configKey.startsWith('resource_')) {
          category = 'resource'
        }
        return { ...item, category }
      })
      setData(categorized)
    } catch (error) {
      console.error('Fetch configs failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter(item => item.category === activeTab)

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      configKey: categoryConfig[activeTab as keyof typeof categoryConfig].keyPrefix
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ApprovalConfig) => {
    setEditingRecord(record)
    form.setFieldsValue({
      id: record.id,
      configKey: record.configKey,
      configValue: record.configValue,
      description: record.description
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await config.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete config failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        const updateData: UpdateConfigRequest = {
          id: values.id!,
          configKey: values.configKey,
          configValue: values.configValue,
          description: values.description
        }
        await config.update(updateData)
        message.success('更新成功')
      } else {
        const createData: CreateConfigRequest = {
          configKey: values.configKey,
          configValue: values.configValue,
          description: values.description
        }
        await config.create(createData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit config failed:', error)
    }
  }

  const columns: ColumnsType<ApprovalConfig> = [
    {
      title: '配置键',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 200,
      render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{text}</code>
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      key: 'configValue',
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date?: string) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
            title="确定要删除该配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const tabItems = Object.entries(categoryConfig).map(([key, config]) => ({
    key,
    label: config.title
  }))

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>系统配置</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增配置
          </Button>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
        <p style={{ color: '#666', marginBottom: 16 }}>
          {categoryConfig[activeTab as keyof typeof categoryConfig].description}
        </p>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条配置`
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="configKey"
            label="配置键"
            rules={[
              { required: true, message: '请输入配置键' },
              { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
            ]}
          >
            <Input placeholder="例如: attachment_max_size" />
          </Form.Item>
          <Form.Item
            name="configValue"
            label="配置值"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <TextArea rows={3} placeholder="请输入配置值" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入配置描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Config
