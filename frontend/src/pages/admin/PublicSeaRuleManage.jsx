import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  message,
  Space,
  Popconfirm,
  Input,
  Switch,
  Select,
  InputNumber,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getPublicSeaRules,
  createPublicSeaRule,
  updatePublicSeaRule,
  deletePublicSeaRule,
} from '../../api/publicSeaRule'

const { Option } = Select
const { TextArea } = Input

const ruleTypeMap = {
  NEW_LEAD: '新线索规则',
  FOLLOW_UP: '跟进规则',
  QUOTATION: '报价规则',
  MEASURE: '量房规则',
}

const PublicSeaRuleManage = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPublicSeaRules()
      setData(res || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
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

  const handleDelete = async (id) => {
    try {
      await deletePublicSeaRule(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await updatePublicSeaRule(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createPublicSeaRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleToggleEnabled = async (record, enabled) => {
    try {
      await updatePublicSeaRule(record.id, { ...record, enabled })
      message.success('状态更新成功')
      loadData()
    } catch (e) {}
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      width: 250,
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      width: 120,
      render: (type) => ruleTypeMap[type] || type,
    },
    {
      title: '进公海天数',
      dataIndex: 'daysBeforePublic',
      width: 120,
      render: (days) => `${days} 天`,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: '规则描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>公海规则管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增规则
        </Button>
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal
        title={editingItem ? '编辑公海规则' : '新增公海规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
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
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="请选择规则类型">
              <Option value="NEW_LEAD">新线索规则</Option>
              <Option value="FOLLOW_UP">跟进规则</Option>
              <Option value="QUOTATION">报价规则</Option>
              <Option value="MEASURE">量房规则</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="daysBeforePublic"
            label="进入公海天数"
            rules={[{ required: true, message: '请输入天数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="请输入多少天后进入公海"
              addonAfter="天"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="规则描述"
          >
            <TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Form.Item
            name="enabled"
            label="是否启用"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PublicSeaRuleManage
