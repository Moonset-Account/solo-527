import { Card, Form, Input, Select, DatePicker, Button, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { leaveApi } from '@/services/index'
import { childApi } from '@/services/children'
import { useAuthStore } from '@/store/auth'

const { TextArea } = Input
const { RangePicker } = DatePicker

const LeaveCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [form] = Form.useForm()

  const { data: children } = useQuery(
    ['my-children'],
    () => childApi.getList({ status: 'active' }).then((res) => res.data.results)
  )

  const createMutation = useMutation(
    (data: any) => leaveApi.create(data),
    {
      onSuccess: () => {
        message.success('提交成功')
        queryClient.invalidateQueries(['leave-requests'])
        navigate('/leave')
      }
    }
  )

  const onFinish = (values: any) => {
    const data = {
      child: values.child,
      leave_type: values.leave_type,
      start_date: values.date_range[0].format('YYYY-MM-DD'),
      end_date: values.date_range[1].format('YYYY-MM-DD'),
      start_session: values.start_session || 'full',
      end_session: values.end_session || 'full',
      reason: values.reason
    }
    createMutation.mutate(data)
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginRight: 12 }} />
          提交请假
        </h2>
      </div>

      <Card bordered={false} style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="选择儿童"
            name="child"
            rules={[{ required: true, message: '请选择儿童' }]}
          >
            <Select
              placeholder="请选择儿童"
              options={children?.map((c: any) => ({ label: `${c.name} (${c.class_name})`, value: c.id }))}
            />
          </Form.Item>

          <Form.Item
            label="请假类型"
            name="leave_type"
            rules={[{ required: true, message: '请选择请假类型' }]}
          >
            <Select>
              <Select.Option value="sick">病假</Select.Option>
              <Select.Option value="personal">事假</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="请假日期"
            name="date_range"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="请假原因" name="reason" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细说明请假原因" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
              提交
            </Button>
            <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LeaveCreate
