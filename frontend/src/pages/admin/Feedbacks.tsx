import { useEffect, useState } from 'react';
import { Tabs, Table, Card, Button, Modal, Form, Input, Select, Rate, message, Switch, DatePicker, Tag, List } from 'antd';
import { PlusOutlined, BellOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { WorkFeedbackDto, HomeSchoolFeedbackDto, FeedbackTypeMap, User } from '../../types';

export default function AdminFeedbacks() {
  const [workFeedbacks, setWorkFeedbacks] = useState<WorkFeedbackDto[]>([]);
  const [homeFeedbacks, setHomeFeedbacks] = useState<HomeSchoolFeedbackDto[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [homeModalOpen, setHomeModalOpen] = useState(false);
  const [workForm] = Form.useForm();
  const [homeForm] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.feedbacks.workList(),
      api.feedbacks.homeSchoolList(),
      api.auth.getUsersByRole('Student')
    ]).then(([w, h, s]) => {
      setWorkFeedbacks(w as WorkFeedbackDto[]);
      setHomeFeedbacks(h as HomeSchoolFeedbackDto[]);
      setStudents(s as User[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateWork = async (values: any) => {
    try {
      await api.feedbacks.createWork({
        ...values,
        score: values.score * 20
      });
      message.success('作品反馈已创建');
      setWorkModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleCreateHome = async (values: any) => {
    try {
      await api.feedbacks.createHomeSchool({
        ...values,
        reminderDate: values.reminderDate ? values.reminderDate.toISOString() : null
      });
      message.success('家校反馈已创建');
      setHomeModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleNotifyParent = async (id: number) => {
    try {
      await api.feedbacks.notifyParent(id);
      message.success('已通知家长');
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const workColumns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '作品', dataIndex: 'workTitle', key: 'workTitle' },
    { title: '课程', dataIndex: 'className', key: 'className' },
    { title: '评分', dataIndex: 'score', key: 'score', render: (s: number) => (
      <span><Rate disabled value={s / 20} count={5} style={{ fontSize: 14 }} /> {s}分</span>
    )},
    { title: '评语', dataIndex: 'feedback', key: 'feedback', ellipsis: true },
    { title: '老师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '家长通知', dataIndex: 'parentNotified', key: 'notified', render: (v: boolean) =>
      v ? <Tag color="green">已通知</Tag> : <Tag color="orange">未通知</Tag>
    },
    { title: '时间', key: 'time', render: (_: any, r: WorkFeedbackDto) => dayjs(r.createdAt).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'action', render: (_: any, r: WorkFeedbackDto) =>
        !r.parentNotified ? (
          <Button size="small" icon={<SendOutlined />} type="link" onClick={() => handleNotifyParent(r.id)}>
            通知家长
          </Button>
        ) : null
    }
  ];

  const homeColumns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => FeedbackTypeMap[t as keyof typeof FeedbackTypeMap] },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '创建人', dataIndex: 'createdByName', key: 'createdByName' },
    { title: '提醒', dataIndex: 'isReminder', key: 'reminder', render: (v: boolean) =>
      v ? <Tag color="orange"><BellOutlined /> 提醒</Tag> : null
    },
    { title: '家长已读', dataIndex: 'parentRead', key: 'read', render: (v: boolean) =>
      v ? <Tag color="green">已读</Tag> : <Tag color="red">未读</Tag>
    },
    { title: '纳入月报', key: 'report', render: (_: any, r: HomeSchoolFeedbackDto) =>
      <Tag color="blue">是</Tag>
    },
    { title: '时间', key: 'time', render: (_: any, r: HomeSchoolFeedbackDto) => dayjs(r.createdAt).format('MM-DD HH:mm') }
  ];

  const feedbackTypeOptions = Object.entries(FeedbackTypeMap).map(([value, label]) => ({ value, label }));

  return (
    <div>
      <div className="page-title">家校反馈</div>
      <Card className="card-shadow">
        <Tabs
          items={[
            {
              key: 'work',
              label: '作品反馈',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { workForm.resetFields(); setWorkModalOpen(true); }}>
                      新建作品反馈
                    </Button>
                  </div>
                  <Table rowKey="id" loading={loading} columns={workColumns} dataSource={workFeedbacks} pagination={{ pageSize: 10 }} size="small" />
                </>
              )
            },
            {
              key: 'home',
              label: '家校沟通反馈',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { homeForm.resetFields(); setHomeModalOpen(true); }}>
                      新建反馈
                    </Button>
                  </div>
                  <Table rowKey="id" loading={loading} columns={homeColumns} dataSource={homeFeedbacks} pagination={{ pageSize: 10 }} size="small" />
                </>
              )
            }
          ]}
        />
      </Card>

      <Modal title="新建作品反馈" open={workModalOpen} onCancel={() => setWorkModalOpen(false)}
        onOk={() => workForm.submit()} width={560} destroyOnClose>
        <Form form={workForm} layout="vertical" onFinish={handleCreateWork} initialValues={{ score: 4, notifyParent: true }}>
          <Form.Item name="studentId" label="选择学生" rules={[{ required: true }]}>
            <Select placeholder="选择学生" showSearch optionFilterProp="children">
              {students.map(s => <Select.Option key={s.id} value={s.id}>{s.realName}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="scheduleId" label="关联课次">
            <Input placeholder="可选，关联具体课次" type="number" />
          </Form.Item>
          <Form.Item name="workTitle" label="作品标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="score" label="评分">
            <Rate />
          </Form.Item>
          <Form.Item name="feedback" label="评语" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="suggestions" label="改进建议">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notifyParent" label="通知家长" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新建家校反馈" open={homeModalOpen} onCancel={() => setHomeModalOpen(false)}
        onOk={() => homeForm.submit()} width={560} destroyOnClose>
        <Form form={homeForm} layout="vertical" onFinish={handleCreateHome}
          initialValues={{ type: 'StudyProgress', isReminder: false, includeInMonthlyReport: true }}>
          <Form.Item name="studentId" label="选择学生" rules={[{ required: true }]}>
            <Select placeholder="选择学生" showSearch optionFilterProp="children">
              {students.map(s => <Select.Option key={s.id} value={s.id}>{s.realName}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="反馈类型" rules={[{ required: true }]}>
            <Select options={feedbackTypeOptions} />
          </Form.Item>
          <Form.Item name="content" label="反馈内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请输入反馈内容（将推送给家长及纳入月报）" />
          </Form.Item>
          <Form.Item name="isReminder" label="设置为待办提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isReminder !== cur.isReminder}>
            {({ getFieldValue }) => getFieldValue('isReminder') ? (
              <Form.Item name="reminderDate" label="提醒日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            ) : null}
          </Form.Item>
          <Form.Item name="includeInMonthlyReport" label="纳入月底复盘报告" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
