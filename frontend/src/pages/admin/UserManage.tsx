import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, Input, Modal, Form, message,
  Popconfirm, Switch,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'
import { useAuthStore } from '@/store/auth'

const roleColor: Record<string, string> = {
  student: 'blue', dorm_manager: 'green', maintenance: 'cyan', admin: 'purple',
}

export default function UserManage() {
  const { user } = useAuthStore()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<any>({})
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/users/', { params: { page, ...params } })
      setList(data.results)
      setTotal(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [page, params])

  const openEdit = (record: any) => {
    setEditing(record)
    form.setFieldsValue({
      role: record.role,
      is_active: record.is_active,
      is_verified: record.is_verified,
      dorm_building: record.dorm_building,
      dorm_room: record.dorm_room,
      phone: record.phone,
      real_name: record.real_name,
    })
    setEditOpen(true)
  }

  const onSubmit = async (values: any) => {
    try {
      await axios.patch(`/api/users/${editing.id}/`, values)
      message.success('更新成功')
      setEditOpen(false)
      fetchList()
    } catch {}
  }

  const toggleVerify = async (record: any) => {
    try {
      await axios.post(`/api/users/${record.id}/verify/`, { is_verified: !record.is_verified })
      message.success('操作成功')
      fetchList()
    } catch {}
  }

  const remove = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}/`)
      message.success('已删除')
      fetchList()
    } catch {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'real_name', width: 120 },
    { title: '学号/工号', dataIndex: 'student_id', width: 120 },
    {
      title: '角色', dataIndex: 'role', width: 100,
      render: (v: string, r: any) => <Tag color={roleColor[v]}>{r.role_display}</Tag>,
    },
    { title: '手机', dataIndex: 'phone', width: 130 },
    { title: '宿舍楼', dataIndex: 'dorm_building', width: 100 },
    { title: '宿舍号', dataIndex: 'dorm_room', width: 100 },
    {
      title: '认证', dataIndex: 'is_verified', width: 80,
      render: (v: boolean, r: any) => user?.role === 'admin' ? (
        <Switch size="small" checked={v} onChange={() => toggleVerify(r)} />
      ) : (
        <Tag color={v ? 'green' : 'orange'}>{v ? '已认证' : '待审核'}</Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '正常' : '禁用'}</Tag>,
    },
    { title: '注册时间', dataIndex: 'date_joined', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
          {user?.role === 'admin' && (
            <Popconfirm title="确认删除该用户？" onConfirm={() => remove(r.id)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="角色" allowClear style={{ width: 140 }}
            options={[
              { value: 'student', label: '学生' },
              { value: 'dorm_manager', label: '宿管老师' },
              { value: 'maintenance', label: '维修人员' },
              { value: 'admin', label: '管理员' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, role: v }))}
          />
          <Select
            placeholder="认证状态" allowClear style={{ width: 140 }}
            options={[{ value: 'true', label: '已认证' }, { value: 'false', label: '待审核' }]}
            onChange={(v) => setParams((p: any) => ({ ...p, is_verified: v }))}
          />
          <Input
            placeholder="搜索用户名/姓名/学号" allowClear prefix={<SearchOutlined />} style={{ width: 240 }}
            onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id" loading={loading} dataSource={list} columns={columns} scroll={{ x: 1300 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      <Modal title="编辑用户" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item label="真实姓名" name="real_name"><Input /></Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'student', label: '学生' },
              { value: 'dorm_manager', label: '宿管老师' },
              { value: 'maintenance', label: '维修人员' },
              { value: 'admin', label: '管理员' },
            ]} />
          </Form.Item>
          <Form.Item label="手机" name="phone"><Input /></Form.Item>
          <Form.Item label="宿舍楼" name="dorm_building"><Input /></Form.Item>
          <Form.Item label="宿舍号" name="dorm_room"><Input /></Form.Item>
          <Space>
            <Form.Item label="已启用" name="is_active" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item label="已认证" name="is_verified" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
