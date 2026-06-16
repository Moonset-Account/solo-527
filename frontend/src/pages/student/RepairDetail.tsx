import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Image, Timeline, Button, Space, Form, Input, Rate, List, Avatar, message, Row, Col } from 'antd'
import { LeftOutlined, CommentOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'
import { useAuthStore } from '@/store/auth'

const { TextArea } = Input

const statusColorMap: Record<string, string> = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'cyan',
  completed: 'green',
  cancelled: 'default',
}

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [commentForm] = Form.useForm()

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
  }, [id])

  const submitComment = async (values: any) => {
    try {
      await axios.post(`/api/repairs/${id}/comment/`, values)
      message.success('评价提交成功')
      commentForm.resetFields()
      fetchDetail()
    } catch {}
  }

  if (!data) return <Card loading={loading} />

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} />
            <span>报修详情 #{data.id}</span>
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
          <Descriptions.Item label="状态">
            <Tag color={statusColorMap[data.status]}>{data.status_display}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="位置">{data.dorm_building}-{data.dorm_room}</Descriptions.Item>
          <Descriptions.Item label="联系人">{data.contact_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{data.contact_phone}</Descriptions.Item>
          <Descriptions.Item label="申请人">{data.applicant_info?.real_name || data.applicant_info?.username}</Descriptions.Item>
          <Descriptions.Item label="处理人">{data.assignee_info?.real_name || data.assignee_info?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{data.completed_at ? dayjs(data.completed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="处理时长">{data.processing_time_hours ? `${data.processing_time_hours} 小时` : '-'}</Descriptions.Item>
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
                {p.remark && <div style={{ marginTop: 4, color: '#333' }}>{p.remark}</div>}
              </div>
            ),
          })) || []}
        />
      </Card>

      {data.comments?.length > 0 && (
        <Card title="评价">
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

      {user?.role === 'student' && data.status === 'completed' && (
        <Card title="发表评价" extra={<CommentOutlined />}>
          <Form form={commentForm} layout="vertical" onFinish={submitComment}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="评分" name="rating">
                  <Rate />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="评价内容" name="content" rules={[{ required: true }]}>
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">提交评价</Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Space>
  )
}
