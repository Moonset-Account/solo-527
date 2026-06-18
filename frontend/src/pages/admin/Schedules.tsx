import { useEffect, useState } from 'react';
import {
  Table, Card, Button, Space, Modal, Form, Select, DatePicker, Input, message,
  Tag, Popconfirm, List, Divider
} from 'antd';
import { PlusOutlined, SwapOutlined, StopOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { api } from '../../api';
import { ScheduleDto, ClassDto, ScheduleStatusMap, BatchFailedItem } from '../../types';
import { BatchOperationDto } from '../../types';

export default function AdminSchedules() {
  const [data, setData] = useState<ScheduleDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDto | null>(null);
  const [batchResult, setBatchResult] = useState<BatchOperationDto | null>(null);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    const weekStart = dayjs().startOf('week').toISOString();
    const weekEnd = dayjs().add(2, 'week').endOf('week').toISOString();
    Promise.all([
      api.schedules.list({ startDate: weekStart, endDate: weekEnd }),
      api.classes.list()
    ]).then(([schedules, cls]) => {
      setData(schedules as ScheduleDto[]);
      setClasses(cls as ClassDto[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.schedules.create({
        ...values,
        startTime: values.time[0].toISOString(),
        endTime: values.time[1].toISOString(),
        durationHours: values.time[1].diff(values.time[0], 'hour')
      });
      message.success('课表已创建');
      setCreateOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleBatchCreate = async (values: any) => {
    try {
      const schedules: any[] = [];
      const startDate = values.dateRange[0];
      const endDate = values.dateRange[1];
      const startTime = values.time[0];
      const endTime = values.time[1];

      for (let d = startDate.clone(); d.isBefore(endDate) || d.isSame(endDate, 'day'); d = d.add(1, 'day')) {
        if (values.weekdays.includes(d.day())) {
          schedules.push({
            classId: values.classId,
            classroom: values.classroom,
            startTime: d.hour(startTime.hour()).minute(startTime.minute()).second(0).toISOString(),
            endTime: d.hour(endTime.hour()).minute(endTime.minute()).second(0).toISOString(),
            durationHours: endTime.diff(startTime, 'hour')
          });
        }
      }

      if (schedules.length === 0) {
        message.warning('所选日期范围内没有符合的日期');
        return;
      }

      const result = await api.schedules.batchCreate(schedules);
      setBatchResult(result as BatchOperationDto);
      message.success(`批量创建完成：成功${(result as any).successCount}条，失败${(result as any).failedCount}条`);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleReschedule = async (values: any) => {
    if (!selectedSchedule) return;
    try {
      await api.schedules.reschedule({
        scheduleId: selectedSchedule.id,
        newStartTime: values.time[0].toISOString(),
        newEndTime: values.time[1].toISOString(),
        classroom: values.classroom,
        reason: values.reason
      });
      message.success('调课成功');
      setRescheduleOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleCancel = async (values: any) => {
    if (!selectedSchedule) return;
    try {
      await api.schedules.cancel(selectedSchedule.id, values);
      message.success('课表已取消');
      setCancelOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const columns = [
    { title: '日期', key: 'date', render: (_: any, r: ScheduleDto) => dayjs(r.startTime).format('YYYY-MM-DD ddd') },
    { title: '时间', key: 'time', render: (_: any, r: ScheduleDto) =>
      `${dayjs(r.startTime).format('HH:mm')} - ${dayjs(r.endTime).format('HH:mm')}`
    },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '老师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '课时', dataIndex: 'durationHours', key: 'hours', render: (h: number) => `${h}课时` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
        const map: Record<string, string> = { Scheduled: 'blue', Completed: 'green', Cancelled: 'red', Rescheduled: 'orange' };
        return <Tag color={map[s]}>{ScheduleStatusMap[s as keyof typeof ScheduleStatusMap]}</Tag>;
    }},
    {
      title: '操作', key: 'action', render: (_: any, r: ScheduleDto) => (
        <Space size="small">
          {r.status === 'Scheduled' && (
            <>
              <Button size="small" icon={<SwapOutlined />} type="link" onClick={() => {
                setSelectedSchedule(r);
                rescheduleForm.resetFields();
                setRescheduleOpen(true);
              }}>调课</Button>
              <Popconfirm title="确定取消此课表？" onConfirm={() => {
                setSelectedSchedule(r);
                cancelForm.resetFields();
                setCancelOpen(true);
              }}>
                <Button size="small" danger icon={<StopOutlined />} type="link">取消</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>课表管理</div>
        <Space>
          <Button icon={<InboxOutlined />} onClick={() => { setBatchResult(null); batchForm.resetFields(); setBatchOpen(true); }}>
            批量排课
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateOpen(true); }}>
            单条排课
          </Button>
        </Space>
      </div>
      <Card className="card-shadow">
        <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="单条排课" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()} width={500} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="classId" label="选择班级" rules={[{ required: true }]}>
            <Select placeholder="请选择班级">
              {classes.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="time" label="课程时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="classroom" label="教室">
            <Input placeholder="如：A101" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量排课" open={batchOpen} onCancel={() => setBatchOpen(false)}
        onOk={() => batchForm.submit()} width={600} destroyOnClose>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchCreate}>
          <Form.Item name="classId" label="选择班级" rules={[{ required: true }]}>
            <Select placeholder="请选择班级">
              {classes.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="weekdays" label="选择星期" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择要排课的星期">
              <Select.Option value={1}>周一</Select.Option>
              <Select.Option value={2}>周二</Select.Option>
              <Select.Option value={3}>周三</Select.Option>
              <Select.Option value={4}>周四</Select.Option>
              <Select.Option value={5}>周五</Select.Option>
              <Select.Option value={6}>周六</Select.Option>
              <Select.Option value={0}>周日</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="time" label="每日时间段" rules={[{ required: true }]}>
            <DatePicker.RangePicker picker="time" style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="classroom" label="教室">
            <Input placeholder="如：A101" />
          </Form.Item>
        </Form>
        {batchResult && batchResult.failedItemsList && batchResult.failedItemsList.length > 0 && (
          <>
            <Divider />
            <div style={{ color: '#ff4d4f', marginBottom: 8, fontWeight: 600 }}>
              失败项（可修改后重新提交）：
            </div>
            <List
              size="small"
              dataSource={batchResult.failedItemsList}
              renderItem={(item: BatchFailedItem) => (
                <List.Item>
                  <List.Item.Meta title={item.itemName} description={item.errorMessage} />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>

      <Modal title="调课" open={rescheduleOpen} onCancel={() => setRescheduleOpen(false)}
        onOk={() => rescheduleForm.submit()} width={500} destroyOnClose>
        {selectedSchedule && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <div><strong>原课程：</strong>{selectedSchedule.className}</div>
            <div><strong>原时间：</strong>{dayjs(selectedSchedule.startTime).format('YYYY-MM-DD HH:mm')}
              - {dayjs(selectedSchedule.endTime).format('HH:mm')}</div>
          </div>
        )}
        <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
          <Form.Item name="time" label="新课程时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="classroom" label="新教室">
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="调课原因" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="取消课表" open={cancelOpen} onCancel={() => setCancelOpen(false)}
        onOk={() => cancelForm.submit()} destroyOnClose>
        <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
          <Form.Item name="reason" label="取消原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
