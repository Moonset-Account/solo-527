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
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getLostReasons,
  createLostReason,
  updateLostReason,
  deleteLostReason,
} from '../../api/lostReason'

const LostReasonManage = () => {
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
      const res = await getLostReasons()
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
      await deleteLostReason(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await updateLostReason(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createLostReason(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleToggleEnabled = async (record, enabled) => {
    try {
      await updateLostReason(record.id, { ...record, enabled })
      message.success('状态更新成功')
      loadData()
    } catch (e) {}
  }

  const columns = [
    {
      title: '原因名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 150,
      render: (category) => category ? <Tag>{category}</Tag> : '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
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
        <h2>流失原因管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增原因
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
        title={editingItem ? '编辑流失原因' : '新增流失原因'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="原因名称"
            rules={[{ required: true, message: '请输入原因名称' }]}
          >
            <Input placeholder="请输入原因名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类，如：价格因素、竞争因素等" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            initialValue={0}
          >
            <Input type="number" placeholder="请输入排序值" />
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

export default LostReasonManage
