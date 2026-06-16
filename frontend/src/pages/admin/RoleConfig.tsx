import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Switch, message,
  Drawer, Descriptions, Timeline,
} from 'antd'
import { EditOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { TextArea } = Input

export default function RoleConfig() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/users/role-configs/')
      setList(data.results || data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const openEdit = (record: any) => {
    setEditing(record)
    form.setFieldsValue({
      description: record.description,
      permissions: JSON.stringify(record.permissions, null, 2),
      is_active: record.is_active,
    })
    setEditOpen(true)
  }

  const viewHistory = async (record: any) => {
    setEditing(record)
    const { data } = await axios.get('/api/users/role-history/', { params: { role_config: record.id } })
    setHistory(data.results || data)
    setHistoryOpen(true)
  }

  const onSubmit = async (values: any) => {
    try {
      let permissions: any = {}
      try {
        permissions = JSON.parse(values.permissions)
      } catch {
        message.error('权限配置JSON格式错误')
        return
      }
      await axios.patch(`/api/users/role-configs/${editing.id}/`, {
        description: values.description,
        permissions,
        is_active: values.is_active,
      })
      message.success('保存成功')
      setEditOpen(false)
      fetchList()
    } catch {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '角色', dataIndex: 'role_display', width: 120, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '描述', dataIndex: 'description' },
    {
      title: '状态', dataIndex: 'is_active', width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updated_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => viewHistory(r)}>变更记录</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="角色配置">
        <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={false} />
      </Card>

      <Modal title={`编辑角色: ${editing?.role_display}`} open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item label="描述" name="description"><TextArea rows={2} /></Form.Item>
          <Form.Item label="权限配置(JSON)" name="permissions" rules={[{ required: true }]}>
            <TextArea rows={10} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item label="是否启用" name="is_active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`${editing?.role_display} - 变更记录`}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={600}
      >
        {history.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无变更记录</div>
        ) : (
          <Timeline
            items={history.map((h: any) => ({
              color: 'blue',
              children: (
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="修改人">{h.changed_by_name || '系统'}</Descriptions.Item>
                    <Descriptions.Item label="修改时间">{dayjs(h.changed_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                    {h.change_reason && <Descriptions.Item label="原因">{h.change_reason}</Descriptions.Item>}
                  </Descriptions>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#faad14', fontWeight: 600, marginBottom: 4 }}>修改前</div>
                      <pre style={{ background: '#fff7e6', padding: 8, borderRadius: 4, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(h.old_data, null, 2)}
                      </pre>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#52c41a', fontWeight: 600, marginBottom: 4 }}>修改后</div>
                      <pre style={{ background: '#f6ffed', padding: 8, borderRadius: 4, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(h.new_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </Card>
              ),
            }))}
          />
        )}
      </Drawer>
    </div>
  )
}
