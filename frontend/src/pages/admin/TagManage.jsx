import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Space,
  Tag,
  Popconfirm,
  Select,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
} from '../../api/tag'

const { Option } = Select

const TagManage = () => {
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
      const res = await getAllTags()
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
      await deleteTag(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await updateTag(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createTag(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 120,
      render: (color) => (
        <Space>
          <div style={{ width: 20, height: 20, backgroundColor: color, borderRadius: 4 }} />
          <span>{color}</span>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 150,
      render: (category) => category || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
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
        <h2>标签管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增标签
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
        title={editingItem ? '编辑标签' : '新增标签'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item
            name="color"
            label="标签颜色"
            rules={[{ required: true, message: '请选择颜色' }]}
            initialValue="#1890ff"
          >
            <Select>
              <Option value="#f5222d">红色</Option>
              <Option value="#faad14">橙色</Option>
              <Option value="#fadb14">黄色</Option>
              <Option value="#52c41a">绿色</Option>
              <Option value="#13c2c2">青色</Option>
              <Option value="#1890ff">蓝色</Option>
              <Option value="#722ed1">紫色</Option>
              <Option value="#eb2f96">粉色</Option>
              <Option value="#fa8c16">橙色</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            initialValue={0}
          >
            <Input type="number" placeholder="请输入排序值" />
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

export default TagManage
