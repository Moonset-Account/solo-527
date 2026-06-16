import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Switch, DatePicker,
  Checkbox, message, Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { TextArea } = Input

export default function AnnouncementManage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/notifications/announcements/')
      setList(data.results || data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const openModal = (record?: any) => {
    setEditing(record)
    form.setFieldsValue({
      title: record?.title || '',
      content: record?.content || '',
      target_roles: record?.target_roles || [],
      target_buildings: record?.target_buildings || [],
      is_top: record?.is_top || false,
      is_published: record?.is_published ?? true,
      expires_at: record?.expires_at ? dayjs(record.expires_at) : undefined,
    })
    setModalOpen(true)
  }

  const onSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        expires_at: values.expires_at ? values.expires_at.toISOString() : null,
      }
      if (editing) {
        await axios.put(`/api/notifications/announcements/${editing.id}/`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/api/notifications/announcements/', payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchList()
    } catch {}
  }

  const remove = async (id: number) => {
    try {
      await axios.delete(`/api/notifications/announcements/${id}/`)
      message.success('已删除')
      fetchList()
    } catch {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '标题', dataIndex: 'title',
      render: (t: string, r: any) => (
        <Space>
          {r.is_top && <Tag color="red">置顶</Tag>}
          <span>{t}</span>
        </Space>
      ),
    },
    { title: '发布人', dataIndex: 'author_info', width: 120, render: (a: any) => a?.real_name || a?.username || '-' },
    {
      title: '可见范围', dataIndex: 'target_roles', width: 200,
      render: (roles: string[], r: any) => (
        <Space wrap>
          {roles.length === 0 ? <Tag>全部角色</Tag> : roles.map((r) => <Tag key={r}>{r}</Tag>)}
          {r.target_buildings?.length === 0 ? <Tag color="blue">全部楼栋</Tag> : r.target_buildings?.map((b: string) => <Tag key={b} color="blue">{b}</Tag>)}
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'is_published', width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '已发布' : '草稿'}</Tag>,
    },
    { title: '发布时间', dataIndex: 'published_at', width: 170, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '过期时间', dataIndex: 'expires_at', width: 170, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '永不过期' },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => remove(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="公告管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新建公告</Button>}
    >
      <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? '编辑公告' : '新建公告'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true }]}><TextArea rows={6} /></Form.Item>
          <Form.Item label="目标角色（不选则全部可见）" name="target_roles">
            <Checkbox.Group options={[
              { label: '学生', value: 'student' },
              { label: '宿管老师', value: 'dorm_manager' },
              { label: '维修人员', value: 'maintenance' },
              { label: '管理员', value: 'admin' },
            ]} />
          </Form.Item>
          <Form.Item label="目标楼栋（不选则全部可见）" name="target_buildings">
            <Checkbox.Group options={['1号楼', '2号楼', '3号楼', '4号楼', '5号楼'].map((b) => ({ label: b, value: b }))} />
          </Form.Item>
          <Space>
            <Form.Item label="置顶" name="is_top" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item label="立即发布" name="is_published" valuePropName="checked"><Switch /></Form.Item>
          </Space>
          <Form.Item label="过期时间（可选）" name="expires_at">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
