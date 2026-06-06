import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { memberApi } from '@/api'
import type { Member } from '@/types'
import dayjs from 'dayjs'

const MemberList: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await memberApi.list()
      setMembers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: Member) => {
    setEditingMember(record)
    form.setFieldsValue({
      ...record,
      birthday: record.birthday ? dayjs(record.birthday) : null
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
      }
      if (editingMember) {
        await memberApi.update(editingMember.id, data)
        message.success('更新成功')
      } else {
        await memberApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadMembers()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: '会员编号', dataIndex: 'memberNo', key: 'memberNo' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '生日', dataIndex: 'birthday', key: 'birthday' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'ACTIVE' ? '#10B981' : '#EF4444' }}>
          {status === 'ACTIVE' ? '活跃' : '冻结'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增会员
        </Button>
      </div>

      <Table columns={columns} dataSource={members} rowKey="id" loading={loading} />

      <Modal
        title={editingMember ? '编辑会员' : '新增会员'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="请选择性别">
              <Select.Option value="男">男</Select.Option>
              <Select.Option value="女">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label="生日">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">活跃</Select.Option>
              <Select.Option value="INACTIVE">非活跃</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="请输入来源" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MemberList
