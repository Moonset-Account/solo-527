import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Descriptions, Tag, Image, Timeline, Button, Space, Form, Input, Rate,
  List, Avatar, message, Modal, Select,
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { TextArea } = Input

const statusColorMap: Record<string, string> = {
  pending: 'orange', assigned: 'blue', in_progress: 'cyan', completed: 'green', cancelled: 'default',
}

export default function AdminRepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [assignForm] = Form.useForm()
  const [statusForm] = Form.useForm()

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const { data: res } = await axios.get(`/api/repairs/${id}/`)
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
    const fetchStaff = async () => {
      const { data } = await axios.get('/api/users/', {
        params: { role__in: 'admin,dorm_manager,maintenance', page_size: 100 },
      })
      setStaff(data.results || data)
    }
    fetchStaff()
  }, [id])

  if (!data) return <Card loading={loading} />

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} />
            <span>报修详情 #{data.id}</span>
            <Tag color={statusColorMap[data.status]}>{data.status_display}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => setAssignOpen(true)}>分配处理人</Button>
            <Button type="primary" onClick={() => setStatusOpen(true)}>更新状态</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="标题" span={2}>{data.title}</Descriptions.Item>
          <Descriptions.Item label="类型">{data.repair_type_display}</Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={data.priority === 'urgent' ? 'red' : data.priority === 'high' ? 'orange' : 'blue'}>
              {data.priority_display}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color={statusColorMap[data.status]}>{data.status_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="位置">{data.dorm_building}-{data.dorm_room}</Descriptions.Item>
          <Descriptions.Item label="联系人">{data.contact_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{data.contact_phone}</Descriptions.Item>
          <Descriptions.Item label="申请人">{data.applicant_info?.real_name || data.applicant_info?.username}</Descriptions.Item>
          <Descriptions.Item label="处理人">{data.assignee_info?.real_name || data.assignee_info?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{data.completed_at ? dayjs(data.completed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="处理时长(小时)">{data.processing_time_hours ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="详细描述" span={2}>{data.description}</Descriptions.Item>
          {data.photos?.length > 0 && (
            <Descriptions.Item label="照片" span={2}>
              <Image.PreviewGroup>
                <Space wrap>
                  {data.photos.map((p: any) => (
                    <Image key={p.id} width={120} height={120} src={p.image} style={{ objectFit: 'cover' }} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="处理进度">
        <Timeline
          items={data.progresses?.map((p: any) => ({
            color: p.status === 'completed' ? 'green' : p.status === 'cancelled' ? 'gray' : 'blue',
            children: (
              <div>
                <div>
                  <Tag color={statusColorMap[p.status]}>{p.status_display}</Tag>
                  <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                    {p.operator_info?.real_name || '系统'} · {dayjs(p.created_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
                {p.remark && <div style={{ marginTop: 4 }}>{p.remark}</div>}
              </div>
            ),
          })) || []}
        />
      </Card>

      {data.comments?.length > 0 && (
        <Card title="用户评价">
          <List
            dataSource={data.comments}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={item.user_info?.avatar}>{item.user_info?.real_name?.[0]}</Avatar>}
                  title={
                    <Space>
                      <span>{item.user_info?.real_name || item.user_info?.username}</span>
                      {item.rating && <Rate disabled value={item.rating} />}
                      <span style={{ color: '#999', fontSize: 12 }}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                    </Space>
                  }
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title="分配处理人"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={() => assignForm.submit()}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={async (v) => {
            await axios.post(`/api/repairs/${id}/assign/`, v)
            message.success('分配成功')
            setAssignOpen(false)
            fetchDetail()
          }}
        >
          <Form.Item label="处理人" name="assignee_id" rules={[{ required: true }]}>
            <Select options={staff.map((u) => ({ value: u.id, label: `${u.real_name || u.username} (${u.role_display})` }))} />
          </Form.Item>
          <Form.Item label="备注" name="remark"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新状态"
        open={statusOpen}
        onCancel={() => setStatusOpen(false)}
        onOk={() => statusForm.submit()}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={async (v) => {
            await axios.post(`/api/repairs/${id}/update_status/`, v)
            message.success('更新成功')
            setStatusOpen(false)
            fetchDetail()
          }}
        >
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select options={[
              { value: 'pending', label: '待处理' },
              { value: 'assigned', label: '已分配' },
              { value: 'in_progress', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]} />
          </Form.Item>
          <Form.Item label="备注" name="remark"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
