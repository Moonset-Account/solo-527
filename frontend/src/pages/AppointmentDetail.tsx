import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Tag, Button, Space, Spin, Empty, 
  Modal, Form, Input, Rate, Upload, List, Avatar, message, Tabs, Timeline
} from 'antd';
import { 
  ArrowLeftOutlined, VideoCameraOutlined, 
  EnvironmentOutlined, UploadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { appointmentsApi, feedbackApi } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  in_progress: { color: 'green', text: '进行中' },
  completed: { color: 'gray', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
};

const AppointmentDetail = () => {
  const { id } = useParams();
  const appointmentId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [feedbackForm] = Form.useForm();

  const { data: appointment, isLoading } = useQuery(
    ['appointment', appointmentId],
    () => appointmentsApi.get(appointmentId),
    { enabled: !!appointmentId }
  );

  const { data: attachments } = useQuery(
    ['appointment-attachments', appointmentId],
    () => appointmentsApi.getAttachments(appointmentId),
    { enabled: !!appointmentId }
  );

  const { data: history } = useQuery(
    ['appointment-history', appointmentId],
    () => appointmentsApi.getHistory(appointmentId),
    { enabled: !!appointmentId }
  );

  const { data: feedbackQuestions } = useQuery(
    'feedback-questions',
    () => feedbackApi.getQuestions(user?.role === 'mentor' ? 'mentor' : 'student')
  );

  const updateStatusMutation = useMutation(
    ({ status, reason }: { status: string; reason?: string }) => 
      appointmentsApi.updateStatus(appointmentId, status, reason),
    {
      onSuccess: () => {
        message.success('状态更新成功');
        queryClient.invalidateQueries(['appointment', appointmentId]);
        setCancelVisible(false);
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '操作失败');
      }
    }
  );

  const submitFeedbackMutation = useMutation(
    (values: any) => {
      if (user?.role === 'mentor') {
        return feedbackApi.submitMentor(appointmentId, values);
      }
      return feedbackApi.submitStudent(appointmentId, values);
    },
    {
      onSuccess: () => {
        message.success('评价提交成功');
        setFeedbackVisible(false);
        feedbackForm.resetFields();
        queryClient.invalidateQueries(['appointment', appointmentId]);
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '提交失败');
      }
    }
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const appt = appointment?.data;
  if (!appt) return <Empty description="预约不存在" />;

  const config = statusConfig[appt.status];
  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const canCancel = ['pending', 'confirmed'].includes(appt.status);
  const canStart = appt.status === 'confirmed';
  const canComplete = appt.status === 'in_progress';
  const canFeedback = appt.status === 'completed' && (
    (isStudent && !appt.feedback?.student_submitted_at) ||
    (isMentor && !appt.feedback?.mentor_submitted_at)
  );

  const getOtherParty = () => isStudent ? appt.mentor : appt.student;
  const other: any = getOtherParty();

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await appointmentsApi.uploadAttachment(appointmentId, formData);
      onSuccess('ok');
      queryClient.invalidateQueries(['appointment-attachments', appointmentId]);
      message.success('上传成功');
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const getOtherPartyInfo = () => {
    if (isStudent) {
      return {
        position: other?.current_position,
        company: other?.current_company,
      };
    }
    return {
      position: other?.major,
      company: other?.school,
    };
  };

  const otherInfo = getOtherPartyInfo();

  const tabItems: any = [
    {
      key: 'detail',
      label: '预约详情',
      children: (
        <Space direction="vertical" className="w-full" size="middle">
          <Card size="small" title="基本信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="主题">{appt.title}</Descriptions.Item>
              <Descriptions.Item label="描述">{appt.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="话题">
                {appt.topics?.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(appt.time_slot?.start_time).format('YYYY-MM-DD HH:mm')}
                {' - '}
                {dayjs(appt.time_slot?.end_time).format('HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="形式">
                {appt.meeting_type === 'online' ? '线上' : '线下'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title={isStudent ? '导师信息' : '学生信息'}>
            <div className="flex items-center gap-4">
              <Avatar size={64}>{other?.user?.name?.[0]}</Avatar>
              <div>
                <div className="font-medium text-lg">{other?.user?.name}</div>
                <div className="text-gray-500">
                  {otherInfo.position} @ {otherInfo.company}
                </div>
                {appt.contact_unlocked && other?.user?.phone && (
                  <div className="text-green-600 mt-1">
                    联系方式: {other.user.phone}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {appt.meeting_type === 'online' && appt.meeting_link && ['confirmed', 'in_progress'].includes(appt.status) && (
            <Card size="small" title="会议信息">
              <Space direction="vertical" className="w-full">
                <Button type="primary" icon={<VideoCameraOutlined />} href={appt.meeting_link} target="_blank">
                  进入线上会议室
                </Button>
                {appt.qr_code && (
                  <div className="flex justify-center mt-4">
                    <QRCodeSVG value={appt.meeting_link} size={150} />
                  </div>
                )}
              </Space>
            </Card>
          )}

          {appt.meeting_type === 'offline' && appt.meeting_location && (
            <Card size="small" title="会面地点">
              <p><EnvironmentOutlined /> {appt.meeting_location}</p>
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: 'files',
      label: '附件资料',
      children: (
        <Card size="small">
          <Space direction="vertical" className="w-full" size="middle">
            <Upload
              customRequest={handleUpload}
              showUploadList={false}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
            {!attachments?.data || attachments.data.length === 0 ? (
              <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={attachments.data}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[<Button type="link" size="small">下载</Button>]}
                  >
                    <List.Item.Meta
                      title={item.file_name}
                      description={
                        <span className="text-gray-400 text-xs">
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                          {item.is_offline_upload && <Tag color="orange">离线上传</Tag>}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'history',
      label: '操作记录',
      children: (
        <Card size="small">
          <Timeline
            items={history?.data?.map((log: any) => ({
              color: log.action === 'create' ? 'blue' : log.action === 'update_status' ? 'green' : 'gray',
              children: (
                <div>
                  <div className="font-medium">{log.action}</div>
                  <div className="text-gray-500 text-sm">
                    {log.old_values && log.new_values && (
                      <span>
                        {Object.keys(log.old_values).map(key => (
                          <span key={key}>
                            {key}: {log.old_values[key]} → {log.new_values[key]}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
              ),
            })) || []}
          />
        </Card>
      ),
    },
    {
      key: 'feedback',
      label: '双方评价',
      children: (
        <Card size="small">
          <Space direction="vertical" className="w-full" size="large">
            {appt.feedback?.student_submitted_at ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar size="small">{appt.student?.user?.name?.[0]}</Avatar>
                  <span className="font-medium">学生评价</span>
                  <Rate disabled value={appt.feedback.student_rating} />
                  <span className="text-gray-400 text-xs">
                    {dayjs(appt.feedback.student_submitted_at).format('YYYY-MM-DD')}
                  </span>
                </div>
                <p className="text-gray-600">{appt.feedback.student_comment}</p>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-4">学生尚未评价</div>
            )}
            
            {appt.feedback?.mentor_submitted_at ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar size="small">{appt.mentor?.user?.name?.[0]}</Avatar>
                  <span className="font-medium">导师评价</span>
                  <Rate disabled value={appt.feedback.mentor_rating} />
                  <span className="text-gray-400 text-xs">
                    {dayjs(appt.feedback.mentor_submitted_at).format('YYYY-MM-DD')}
                  </span>
                </div>
                <p className="text-gray-600">{appt.feedback.mentor_comment}</p>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-4">导师尚未评价</div>
            )}
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Tag color={config.color}>{config.text}</Tag>
      </div>

      <Card title={appt.title} extra={
        <Space wrap>
          {canStart && (
            <Button type="primary" onClick={() => updateStatusMutation.mutate({ status: 'in_progress' })}>
              开始会面
            </Button>
          )}
          {canComplete && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => updateStatusMutation.mutate({ status: 'completed' })}>
              结束会面
            </Button>
          )}
          {canFeedback && (
            <Button onClick={() => setFeedbackVisible(true)}>
              提交评价
            </Button>
          )}
          {canCancel && (
            <Button danger onClick={() => setCancelVisible(true)}>
              取消预约
            </Button>
          )}
        </Space>
      }>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="提交评价"
        open={feedbackVisible}
        onCancel={() => setFeedbackVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={(values) => submitFeedbackMutation.mutate(values)}
        >
          <Form.Item name="rating" label="评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          
          {feedbackQuestions?.data?.map((q: any) => (
            <Form.Item
              key={q.id}
              name={`q_${q.id}`}
              label={q.question_text}
              rules={q.is_required ? [{ required: true }] : []}
            >
              {q.question_type === 'text' ? (
                <Input.TextArea rows={3} />
              ) : q.question_type === 'select' ? (
                <select className="w-full h-10 px-3 border rounded">
                  {q.options.map((opt: string, idx: number) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
          
          <Form.Item name="comment" label="评价内容">
            <Input.TextArea rows={4} placeholder="请输入您的评价..." />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitFeedbackMutation.isLoading} block>
              提交评价
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消预约"
        open={cancelVisible}
        onCancel={() => setCancelVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={({ reason }) => 
          updateStatusMutation.mutate({ status: 'cancelled', reason })
        }>
          <Form.Item name="reason" label="取消原因" rules={[{ required: true, message: '请输入取消原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明取消原因..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setCancelVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit" loading={updateStatusMutation.isLoading}>
                确认取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentDetail;
