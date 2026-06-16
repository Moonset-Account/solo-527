import { useState, useEffect } from 'react'
import {
  Card, Form, Input, Select, Button, Space, message, Table, Tag, Modal,
  Checkbox, Transfer,
} from 'antd'
import { SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { TextArea } = Input

export default function PushNotification() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [pushModal, setPushModal] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<any>(null)
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [targetBuildings, setTargetBuildings] = useState<string[]>([])
  const [targetUserIds, setTargetUserIds] = useState<number[]>([])

  useEffect(() => {
    fetchList()
    const fetchUsers = async () => {
      const { data } = await axios.get('/api/users/', { params: { page_size: 500, is_active: true } })
      setUsers(data.results || data)
    }
    fetchUsers()
  }, [])

  const fetchList = async () => {
    const { data } = await axios.get('/api/notifications/list/')
    setList(data.results || data)
  }

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post('/api/notifications/list/', values)
      message.success('通知创建成功')
      form.resetFields()
      fetchList()
    } finally {
      setLoading(false)
    }
  }

  const doPush = async () => {
    try {
      await axios.post(`/api/notifications/list/${currentNotification?.id}/push/`, {
        user_ids: targetUserIds,
        target_roles: targetRoles,
        target_buildings: targetBuildings,
      })
      message.success('推送成功')
      setPushModal(false)
    } catch {}
  }

  const allBuildings = Array.from(new Set(users.map((u: any) => u.dorm_building).filter(Boolean)))

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'type_display', width: 120, render: (t: string) => <Tag>{t}</Tag> },
    {
      title: '优先级', dataIndex: 'priority', width: 100,
      render: (v: string) => {
        const colors: Record<string, string> = { normal: 'default', important: 'orange', urgent: 'red' }
        const labels: Record<string, string> = { normal: '普通', important: '重要', urgent: '紧急' }
        return <Tag color={colors[v]}>{labels[v]}</Tag>
      },
    },
    { title: '发送人', dataIndex: 'sender_info', width: 120, render: (s: any) => s?.real_name || s?.username || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, r: any) => (
        <Button size="small" onClick={() => { setCurrentNotification(r); setPushModal(true) }}>
          推送
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="创建通知">
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="type" initialValue="system" rules={[{ required: true }]}>
            <Select options={[
              { value: 'announcement', label: '公告' },
              { value: 'system', label: '系统通知' },
              { value: 'verification', label: '身份审核' },
              { value: 'repair_status', label: '报修状态' },
            ]} />
          </Form.Item>
          <Form.Item label="优先级" name="priority" initialValue="normal" rules={[{ required: true }]}>
            <Select options={[
              { value: 'normal', label: '普通' },
              { value: 'important', label: '重要' },
              { value: 'urgent', label: '紧急' },
            ]} />
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true }]}>
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
              创建通知
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="通知列表">
        <Table rowKey="id" dataSource={list} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={`推送通知: ${currentNotification?.title}`}
        open={pushModal}
        onCancel={() => setPushModal(false)}
        onOk={doPush}
        width={700}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 8 }}>目标角色（不选则全部）:</div>
            <Checkbox.Group
              options={[
                { label: '学生', value: 'student' },
                { label: '宿管老师', value: 'dorm_manager' },
                { label: '维修人员', value: 'maintenance' },
                { label: '管理员', value: 'admin' },
              ]}
              value={targetRoles}
              onChange={setTargetRoles}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>目标楼栋（不选则全部）:</div>
            <Checkbox.Group
              options={allBuildings.map((b) => ({ label: b, value: b }))}
              value={targetBuildings}
              onChange={setTargetBuildings}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>指定用户（可选）:</div>
            <Transfer
              dataSource={users.map((u) => ({
                key: u.id,
                title: `${u.real_name || u.username} (${u.role_display})`,
                description: u.dorm_building || '',
              }))}
              titles={['可选用户', '已选用户']}
              targetKeys={targetUserIds as any}
              onChange={(next) => setTargetUserIds(next as any)}
              render={(item) => item.title}
              listStyle={{ width: 280, height: 200 }}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  )
}
