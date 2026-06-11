import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Space, Button, Modal, Form, Input, DatePicker, message, Typography, Progress, Timeline } from 'antd';
import { PlusOutlined, EditOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { recruitmentApi } from '../api/recruitment';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const RecruitmentCycles: React.FC = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCycle, setEditingCycle] = useState<any>(null);
  const [form] = Form.useForm();
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getCycles();
      if (res.success) {
        setCycles(res.data);
      }
    } catch (error) {
      console.error('Failed to load cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '进行中', color: 'green' },
    completed: { label: '已完成', color: 'blue' },
    upcoming: { label: '即将开始', color: 'orange' },
    archived: { label: '已归档', color: 'default' },
  };

  const openAddModal = () => {
    setEditingCycle(null);
    form.resetFields();
    setMilestones([]);
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingCycle(record);
    form.setFieldsValue({
      ...record,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
    });
    setMilestones(record.milestones || []);
    setModalVisible(true);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', date: null, description: '' }]);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setMilestones(newMilestones);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        name: values.name,
        startDate: values.dateRange[0].toDate(),
        endDate: values.dateRange[1].toDate(),
        description: values.description,
        milestones: milestones.filter(m => m.name),
      };

      if (editingCycle) {
        const res = await recruitmentApi.updateCycle(editingCycle.id, data);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await recruitmentApi.createCycle(data);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadCycles();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getCycleProgress = (cycle: any) => {
    const start = dayjs(cycle.startDate);
    const end = dayjs(cycle.endDate);
    const now = dayjs();
    
    if (now.isBefore(start)) return 0;
    if (now.isAfter(end)) return 100;
    
    const total = end.diff(start, 'day');
    const passed = now.diff(start, 'day');
    return Math.round((passed / total) * 100);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>招聘周期管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新建周期
        </Button>
      </div>

      <Card>
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
          dataSource={cycles}
          loading={loading}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                actions={[
                  <EditOutlined key="edit" onClick={() => openEditModal(item)} />,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      {item.name}
                      <Tag color={statusMap[item.status]?.color}>
                        {statusMap[item.status]?.label}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>
                        <Text type="secondary">
                          {dayjs(item.startDate).format('YYYY-MM-DD')} ~ {dayjs(item.endDate).format('YYYY-MM-DD')}
                        </Text>
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <Progress percent={getCycleProgress(item)} size="small" />
                      </div>
                      <Space wrap>
                        <Tag color="blue">
                          <UserOutlined /> {item.resumeCount} 简历
                        </Tag>
                        <Tag color="green">
                          {item.hireCount} 录用
                        </Tag>
                      </Space>
                      {item.description && (
                        <p style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  }
                />
                
                {item.milestones && item.milestones.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong style={{ fontSize: 12 }}>里程碑</Text>
                    <Timeline
                      style={{ marginTop: 8 }}
                      items={item.milestones.slice(0, 3).map((m: any) => ({
                        color: dayjs(m.date).isBefore(dayjs()) ? 'green' : 'blue',
                        children: (
                          <div>
                            <div style={{ fontSize: 12 }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>
                              {dayjs(m.date).format('MM-DD')}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingCycle ? '编辑招聘周期' : '新建招聘周期'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="周期名称" rules={[{ required: true }]}>
            <Input placeholder="请输入周期名称，如：2024秋季校园招聘" />
          </Form.Item>
          <Form.Item name="dateRange" label="起止日期" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入周期描述" />
          </Form.Item>

          <Form.Item label="里程碑">
            <div>
              {milestones.map((milestone, index) => (
                <div key={index} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  <Space wrap>
                    <Input
                      placeholder="里程碑名称"
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      style={{ width: 150 }}
                    />
                    <DatePicker
                      value={milestone.date ? dayjs(milestone.date) : null}
                      onChange={(date) => updateMilestone(index, 'date', date?.toDate())}
                    />
                    <Button type="link" danger size="small" onClick={() => removeMilestone(index)}>
                      删除
                    </Button>
                  </Space>
                  <Input
                    placeholder="描述"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
              ))}
              <Button type="dashed" block onClick={addMilestone}>
                + 添加里程碑
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecruitmentCycles;
