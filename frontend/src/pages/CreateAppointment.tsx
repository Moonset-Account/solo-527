import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, Button, Space,
  Radio, message, Alert
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { appointmentsApi, mentorsApi, industryApi } from '../api';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const { TextArea } = Input;
const { Option } = Select;

const CreateAppointment = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedMentor, setSelectedMentor] = useState<number | null>(
    mentorId ? Number(mentorId) : null
  );

  const { data: mentors } = useQuery(
    ['mentors-for-create'],
    () => mentorsApi.list({ review_status: 'approved', is_active: true }),
    { enabled: user?.role === 'student' }
  );

  const { data: industries } = useQuery(
    'industries',
    () => industryApi.list(),
    { enabled: user?.role === 'student' }
  );

  const { data: timeSlots } = useQuery(
    ['mentor-timeslots', selectedMentor],
    () => selectedMentor ? mentorsApi.getTimeSlots(selectedMentor, { is_booked: false }) : null,
    { enabled: !!selectedMentor }
  );

  const createMutation = useMutation(
    (values: any) => appointmentsApi.create(values),
    {
      onSuccess: () => {
        message.success('预约创建成功，等待导师确认');
        queryClient.invalidateQueries(['appointments']);
        navigate('/appointments');
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '创建失败');
      }
    }
  );

  const handleSubmit = (values: any) => {
    const data = {
      mentor_id: selectedMentor,
      time_slot_id: values.time_slot_id,
      title: values.title,
      description: values.description,
      topics: values.topics || [],
      meeting_type: values.meeting_type,
      meeting_location: values.meeting_type === 'offline' ? values.meeting_location : undefined,
    };
    createMutation.mutate(data);
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="space-y-4">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Alert type="error" message="只有学生可以发起预约" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <Card title="发起预约">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ meeting_type: 'online' }}
        >
          <Form.Item
            name="mentor_id"
            label="选择导师"
            rules={[{ required: true, message: '请选择导师' }]}
          >
            <Select
              placeholder="搜索并选择导师"
              showSearch
              optionFilterProp="children"
              value={selectedMentor}
              onChange={(val) => setSelectedMentor(val)}
              disabled={!!mentorId}
            >
              {mentors?.data?.items?.map((mentor: any) => (
                <Option key={mentor.id} value={mentor.id}>
                  {mentor.user.name} - {mentor.current_position} @ {mentor.current_company}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMentor && (
            <Form.Item
              name="time_slot_id"
              label="选择时段"
              rules={[{ required: true, message: '请选择预约时段' }]}
            >
              <Select placeholder="选择可预约时段">
                {timeSlots?.data?.map((slot: any) => (
                  <Option key={slot.id} value={slot.id}>
                    {dayjs(slot.start_time).format('YYYY-MM-DD HH:mm')} - {dayjs(slot.end_time).format('HH:mm')}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="title"
            label="咨询主题"
            rules={[{ required: true, message: '请输入咨询主题' }]}
          >
            <Input placeholder="例如：互联网行业求职指导" maxLength={100} />
          </Form.Item>

          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="请描述您想咨询的具体内容..." maxLength={500} />
          </Form.Item>

          <Form.Item name="topics" label="话题标签">
            <Select
              mode="tags"
              placeholder="选择或输入话题标签"
              tokenSeparators={[',']}
            >
              {industries?.data?.map((ind: any) => (
                <Option key={ind.id} value={ind.name}>{ind.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="meeting_type"
            label="会面形式"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="online">线上视频</Radio>
              <Radio value="offline">线下面谈</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.meeting_type !== curr.meeting_type}>
            {({ getFieldValue }) =>
              getFieldValue('meeting_type') === 'offline' ? (
                <Form.Item
                  name="meeting_location"
                  label="会面地点"
                  rules={[{ required: true, message: '请输入会面地点' }]}
                >
                  <Input placeholder="例如：学校就业指导中心302室" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isLoading} icon={<SaveOutlined />}>
                提交预约
              </Button>
              <Button onClick={() => navigate(-1)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateAppointment;
