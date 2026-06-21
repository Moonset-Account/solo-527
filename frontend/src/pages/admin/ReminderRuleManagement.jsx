
import { useState } from 'react'
import { Card, Table, Button, Space, Switch, Modal, Form, Input, Select, Tag, message, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { reminderRuleList, treatmentOptions } from './mockData'

const { Option } = Select

const ReminderRuleManagement = () => {
  const [data, setData] = useState(reminderRuleList)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  const levelMap = {
    urgent: { text: '紧急', color: 'red' },
    warning: { text: '警告', color: 'orange' },
    normal: { text: '普通', color: 'blue' },
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该提醒规则吗？',
      onOk: () => {
        setData(data.filter(item => item.id !== id))
        message.success('删除成功')
      },
    })
  }

  const handleToggle = (record, checked) => {
    setData(data.map(item => item.id === record.id ? { ...item, enabled: checked } : item))
    message.success(checked ? '已启用' : '已禁用')
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        setData(data.map(item => item.id === editingItem.id ? { ...item, ...values } : item))
        message.success('修改成功')
      } else {
        const newItem = {
          ...values,
          id: Math.max(...data.map(d => d.id)) + 1,
          enabled: true,
        }
        setData([...data, newItem])
        message.success('添加成功')
      }
      setModalVisible(false)
    })
  }

  const columns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '关联疗程', dataIndex: 'treatment', key: 'treatment' },
    {
      title: '提醒天数',
      dataIndex: 'daysBefore',
      key: 'daysBefore',
      render: (text) => {
        if (text > 0) return `提前${text}天`
        if (text < 0) return `延后${Math.abs(text)}天`
        return '当天'
      },
    },
    {
      title: '紧急程度',
      dataIndex: 'level',
      key: 'level',
      render: (text) => <Tag color={levelMap[text].color}>{levelMap[text].text}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (text, record) => (
        <Switch checked={text} onChange={(checked) => handleToggle(record, checked)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>提醒规则管理</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑提醒规则' : '新增提醒规则'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="treatment" label="关联疗程" rules={[{ required: true, message: '请选择疗程' }]}>
            <Select>
              <Option value="全部">全部</Option>
              {treatmentOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="daysBefore" label="提醒天数" rules={[{ required: true, message: '请输入提醒天数' }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="正数表示提前，负数表示延后，0表示当天"
            />
          </Form.Item>
          <Form.Item name="level" label="紧急程度" rules={[{ required: true, message: '请选择紧急程度' }]}>
            <Select>
              <Option value="urgent">紧急</Option>
              <Option value="warning">警告</Option>
              <Option value="normal">普通</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="规则描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReminderRuleManagement
