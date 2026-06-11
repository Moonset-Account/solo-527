import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, TimePicker, Select, Modal, Form, Input, message, Typography, List, Calendar, Badge, Row, Col, Empty } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { interviewApi } from '../api/interview';
import { authApi } from '../api/auth';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const InterviewSchedule: React.FC = () => {
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [schedule, setSchedule] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadInterviewers();
  }, []);

  useEffect(() => {
    if (selectedInterviewer) {
      loadSchedule();
      loadInterviewerInterviews();
    }
  }, [selectedInterviewer, selectedDate]);

  const loadInterviewers = async () => {
    try {
      const res = await authApi.getUsers({ role: 'interviewer', pageSize: 100 });
      if (res.success) {
        setInterviewers(res.data.items);
        if (res.data.items.length > 0) {
          setSelectedInterviewer(res.data.items[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load interviewers:', error);
    }
  };

  const loadSchedule = async () => {
    if (!selectedInterviewer) return;
    
    setLoading(true);
    try {
      const res = await interviewApi.getInterviewerSchedule(
        selectedInterviewer,
        selectedDate.format('YYYY-MM-DD')
      );
      if (res.success) {
        setSchedule(res.data);
      } else {
        setSchedule(null);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewerInterviews = async () => {
    if (!selectedInterviewer) return;
    
    try {
      const res = await interviewApi.getInterviews({
        interviewerId: selectedInterviewer,
        pageSize: 100,
      });
      if (res.success) {
        setInterviews(res.data.items);
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
    }
  };

  const handleAddSlot = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields();
      
      const timeSlots = schedule?.timeSlots || [];
      const newSlot = {
        start: values.startTime,
        end: values.endTime,
        available: true,
      };
      
      const updatedSlots = [...timeSlots, newSlot].sort((a: any, b: any) => 
        a.start.localeCompare(b.start)
      );

      const interviewer = interviewers.find(i => i.id === selectedInterviewer);

      const res = await interviewApi.createOrUpdateSchedule({
        interviewerId: selectedInterviewer,
        interviewerName: interviewer?.name || '',
        date: selectedDate.format('YYYY-MM-DD'),
        timeSlots: updatedSlots,
      });

      if (res.success) {
        message.success('档期更新成功');
        setModalVisible(false);
        loadSchedule();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getInterviewerName = (id: string) => {
    return interviewers.find(i => i.id === id)?.name || '';
  };

  const dateCellRender = (value: Dayjs) => {
    const dayInterviews = interviews.filter(
      (i) => i.scheduledTime && dayjs(i.scheduledTime).isSame(value, 'day')
    );

    return (
      <ul className="calendar-events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayInterviews.slice(0, 2).map((item: any) => (
          <li key={item.id} style={{ fontSize: 12, color: '#1677ff', marginBottom: 2 }}>
            <Badge status="processing" text={item.candidateName} />
          </li>
        ))}
        {dayInterviews.length > 2 && (
          <li style={{ fontSize: 12, color: '#999' }}>+{dayInterviews.length - 2} 更多</li>
        )}
      </ul>
    );
  };

  const columns = [
    {
      title: '时间段',
      key: 'time',
      render: (_: any, record: any) => (
        <Space>
          <ClockCircleOutlined />
          <span>{record.start} - {record.end}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={record.available ? 'green' : 'orange'}>
          {record.available ? '可预约' : '已预约'}
        </Tag>
      ),
    },
    {
      title: '关联面试',
      dataIndex: 'interviewId',
      key: 'interviewId',
      render: (id: string) => id || '-',
    },
  ];

  const timeSlots = schedule?.timeSlots || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>面试官档期</Title>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="面试官列表" size="small">
            <List
              dataSource={interviewers}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => setSelectedInterviewer(item.id)}
                  style={{
                    cursor: 'pointer',
                    background: selectedInterviewer === item.id ? '#e6f4ff' : 'transparent',
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={item.email || ''}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="日历视图" size="small" style={{ marginTop: 16 }}>
            <Calendar
              fullscreen={false}
              cellRender={dateCellRender}
              onSelect={(date) => setSelectedDate(date)}
              value={selectedDate}
            />
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title={`${getInterviewerName(selectedInterviewer || '')} - ${selectedDate.format('YYYY年MM月DD日')} 档期`}
            extra={
              <Button type="primary" icon={<CalendarOutlined />} onClick={handleAddSlot}>
                添加档期
              </Button>
            }
          >
            {timeSlots.length === 0 ? (
              <Empty description="暂无档期安排" />
            ) : (
              <Table
                columns={columns}
                dataSource={timeSlots}
                rowKey={(record, index) => index as any}
                size="small"
                pagination={false}
              />
            )}
          </Card>

          <Card title="近期面试安排" style={{ marginTop: 16 }}>
            <List
              dataSource={interviews.slice(0, 10)}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.candidateName}</span>
                        <Tag color="blue">{item.position}</Tag>
                        {item.round && <Tag>第{item.round}轮</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {item.scheduledTime 
                            ? dayjs(item.scheduledTime).format('YYYY-MM-DD HH:mm') 
                            : '待安排时间'}
                        </Text>
                        <Tag color={item.status === 'completed' ? 'green' : 'blue'}>
                          {item.status === 'scheduled' ? '已安排' : item.status === 'completed' ? '已完成' : item.status}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加档期"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveSchedule}
        okText="确认添加"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewSchedule;
