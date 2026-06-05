import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Typography,
  InputNumber,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons'
import { memberApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

export default function MemberList() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data: any = await memberApi.list()
      setMembers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadMembers()
      return
    }
    try {
      setLoading(true)
      const data: any = await memberApi.search(searchKeyword)
      setMembers([data])
    } catch (error) {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingMember(record)
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      gender: record.gender,
      birthday: record.birthday ? dayjs(record.birthday) : null,
      status: record.status,
      expireDate: record.expireDate ? dayjs(record.expireDate) : null,
      remark: record.remark,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        expireDate: values.expireDate ? values.expireDate.format('YYYY-MM-DD') : null,
      }

      if (editingMember) {
        await memberApi.update(editingMember.id, submitData)
        message.success('更新成功')
      } else {
        await memberApi.create(submitData)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadMembers()
    } catch (error) {
      console.error(error)
    }
  }

  const columns = [
    {
      title: '会员编号',
      dataIndex: 'memberNo',
      key: 'memberNo',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (val: string) => val || '-',
    },
    {
      title: '剩余课时',
      dataIndex: 'totalRemainingSessions',
      key: 'remaining',
      render: (val: number) => (
        <Tag color={val <= 3 ? 'red' : 'green'}>{val || 0} 节</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          FROZEN: 'orange',
          EXPIRED: 'red',
          CANCELLED: 'default',
        }
        const labelMap: Record<string, string> = {
          ACTIVE: '正常',
          FROZEN: '已冻结',
          EXPIRED: '已过期',
          CANCELLED: '已注销',
        }
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      },
    },
    {
      title: '入会日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<QrcodeOutlined />}>
            二维码
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          会员管理
        </Title>
        <Space>
          <Input
            placeholder="搜索手机号/会员号"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增会员
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingMember ? '编辑会员' : '新增会员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label="生日">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {editingMember && (
            <>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">正常</Option>
                  <Option value="FROZEN">已冻结</Option>
                  <Option value="EXPIRED">已过期</Option>
                  <Option value="CANCELLED">已注销</Option>
                </Select>
              </Form.Item>
              <Form.Item name="expireDate" label="到期日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
