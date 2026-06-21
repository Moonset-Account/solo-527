
import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Avatar, Modal, Form, Input, Select, Tag, message, InputNumber, Drawer, List } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MoneyCollectOutlined } from '@ant-design/icons'
import { getConsultants, createConsultant, updateConsultant, deleteConsultant, getConsultantCommissions } from '../../api/consultants'

const { Option } = Select

const ConsultantManagement = () => {
  const [data, setData] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [commissionDrawerVisible, setCommissionDrawerVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [currentConsultant, setCurrentConsultant] = useState(null)
  const [consultantCommissions, setConsultantCommissions] = useState([])
  const [form] = Form.useForm()

  const statusMap = {
    active: { text: '在职', color: 'green' },
    inactive: { text: '离职', color: 'red' },
  }

  const loadData = async () => {
    const res = await getConsultants({ pageSize: 100 })
    if (res.success) {
      setData(res.data.list || [])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
      content: '确定要删除该顾问吗？',
      onOk: async () => {
        const res = await deleteConsultant(id)
        if (res.success) {
          message.success('删除成功')
          loadData()
        }
      },
    })
  }

  const handleViewCommission = async (record) => {
    setCurrentConsultant(record)
    setCommissionDrawerVisible(true)
    const res = await getConsultantCommissions(record.id, { pageSize: 50 })
    if (res.success) {
      setConsultantCommissions(res.data.list || [])
    }
  }

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      if (editingItem) {
        const res = await updateConsultant(editingItem.id, values)
        if (res.success) {
          message.success('修改成功')
          setModalVisible(false)
          loadData()
        }
      } else {
        const res = await createConsultant(values)
        if (res.success) {
          message.success('添加成功')
          setModalVisible(false)
          loadData()
        }
      }
    })
  }

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (text) => <Avatar src={text} size={48} />,
    },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '级别', dataIndex: 'level', key: 'level' },
    { title: '提成比例', dataIndex: 'commissionRate', key: 'commissionRate', render: (text) => `${text}%` },
    { title: '总业绩', dataIndex: 'totalSales', key: 'totalSales', render: (text) => `¥${text.toLocaleString()}` },
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={statusMap[text].color}>{statusMap[text].text}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<MoneyCollectOutlined />} onClick={() => handleViewCommission(record)}>提成记录</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>顾问管理</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增顾问
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
        title={editingItem ? '编辑顾问' : '新增顾问'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="level" label="级别" rules={[{ required: true, message: '请选择级别' }]}>
            <Select>
              <Option value="初级顾问">初级顾问</Option>
              <Option value="中级顾问">中级顾问</Option>
              <Option value="高级顾问">高级顾问</Option>
            </Select>
          </Form.Item>
          <Form.Item name="commissionRate" label="提成比例(%)" rules={[{ required: true, message: '请输入提成比例' }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`${currentConsultant?.name} 的提成记录`}
        placement="right"
        width={500}
        open={commissionDrawerVisible}
        onClose={() => setCommissionDrawerVisible(false)}
      >
        <List
          dataSource={consultantCommissions}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={item.type}
                description={
                  <div>
                    <div>订单号：{item.orderNo}</div>
                    <div>时间：{item.createTime}</div>
                  </div>
                }
              />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#52c41a', fontWeight: 'bold' }}>+¥{item.amount}</div>
                <Tag color={item.status === 'settled' ? 'green' : 'orange'}>
                  {item.status === 'settled' ? '已结算' : '待结算'}
                </Tag>
              </div>
            </List.Item>
          )}
        />
        {consultantCommissions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 50 }}>暂无提成记录</div>
        )}
      </Drawer>
    </div>
  )
}

export default ConsultantManagement
