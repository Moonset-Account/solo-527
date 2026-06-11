import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Select, Input, DatePicker, InputNumber, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { interviewApi } from '../api/interview';
import { authApi } from '../api/auth';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const InterviewList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [completingInterview, setCompletingInterview] = useState<any>(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [interviewers, setInterviewers] = useState<any[]>([]);

  useEffect(() => {
    loadInterviews();
    loadInterviewers();
  }, [page, pageSize, statusFilter]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewApi.getInterviews({
        status: statusFilter,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewers = async () => {
    try {
      const res = await authApi.getUsers({ role: 'interviewer', pageSize: 100 });
      if (res.success) {
        setInterviewers(res.data.items);
      }
    } catch (error) {
      console.error('Failed to load interviewers:', error);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待安排', color: 'default' },
    scheduled: { label: '已安排', color: 'blue' },
    in_progress: { label: '进行中', color: 'orange' },
    completed: { label: '已完成', color: 'green' },
    cancelled: { label: '已取消', color: 'red' },
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '轮次',
      dataIndex: 'round',
      key: 'round',
      width: 80,
      render: (round: number) => round ? `第${round}轮` : '-',
    },
    {
      title: '面试官',
      dataIndex: 'interviewerName',
      key: 'interviewerName',
      width: 100,
      render: (name: string) => name || '待分配',
    },
    {
      title: '面试时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '待安排',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => score !== null && score !== undefined ? score : '待评分',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          {record.status === 'scheduled' && (
            <Button type="link" icon={<CheckOutlined />} size="small" onClick={() => openCompleteModal(record)}>
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const openAddModal = () => {
    setEditingInterview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingInterview(record);
    form.setFieldsValue({
      ...record,
      scheduledTime: record.scheduledTime ? dayjs(record.scheduledTime) : null,
    });
    setModalVisible(true);
  };

  const openCompleteModal = (record: any) => {
    setCompletingInterview(record);
    completeForm.resetFields();
    setCompleteModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (values.scheduledTime) {
        values.scheduledTime = values.scheduledTime.toDate();
      }

      if (editingInterview) {
        const res = await interviewApi.updateInterview(editingInterview.id, values);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await interviewApi.createInterview(values);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadInterviews();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleComplete = async () => {
    try {
      const values = await completeForm.validateFields();
      
      const res = await interviewApi.completeInterview(completingInterview.id, values);
      if (res.success) {
        message.success('面试已完成');
        setCompleteModalVisible(false);
        loadInterviews();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>面试管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            安排面试
          </Button>
        </Space>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="筛选状态"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={editingInterview ? '编辑面试' : '安排面试'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
        width={600}
      >
        <Form form={form} {...formItemLayout}>
          <Form.Item name="candidateName" label="候选人" rules={[{ required: true }]}>
            <Input placeholder="请输入候选人姓名" />
          </Form.Item>
          <Form.Item name="resumeId" label="简历ID">
            <Input placeholder="请输入简历ID" />
          </Form.Item>
          <Form.Item name="position" label="岗位" rules={[{ required: true }]}>
            <Input placeholder="请输入应聘岗位" />
          </Form.Item>
          <Form.Item name="round" label="轮次">
            <InputNumber min={1} defaultValue={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interviewerId" label="面试官">
            <Select placeholder="请选择面试官">
              {interviewers.map((i) => (
                <Option key={i.id} value={i.id}>{i.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="scheduledTime" label="面试时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="时长(分钟)">
            <InputNumber min={15} step={15} defaultValue={60} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interviewType" label="面试方式">
            <Select placeholder="请选择面试方式">
              <Option value="onsite">现场面试</Option>
              <Option value="online">线上面试</Option>
              <Option value="phone">电话面试</Option>
            </Select>
          </Form.Item>
          <Form.Item name="location" label="地点/链接">
            <Input placeholder="请输入面试地点或会议链接" />
          </Form.Item>
          <Form.Item name="meetingLink" label="会议链接">
            <Input placeholder="请输入线上会议链接" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成面试"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={handleComplete}
        okText="确认完成"
        width={600}
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="score" label="综合评分" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入0-100的分数" />
          </Form.Item>
          <Form.Item name="feedback" label="面试评价" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请输入面试评价" />
          </Form.Item>
          <Form.Item name="abilityAssessment" label="能力评估">
            <TextArea rows={3} placeholder="请输入能力评估结果" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewList;
