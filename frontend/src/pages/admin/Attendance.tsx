import { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Select, DatePicker, Modal, Form, Tag, message, Radio } from 'antd';
import { CheckOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { ScheduleDto, AttendanceDto, AttendanceStatusMap } from '../../types';

export default function AdminAttendance() {
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [attendances, setAttendances] = useState<AttendanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceDto | null>(null);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  const loadSchedules = () => {
    setLoading(true);
    const today = dayjs();
    api.schedules.list({
      startDate: today.subtract(7, 'day').startOf('day').toISOString(),
      endDate: today.endOf('day').toISOString()
    }).then((res: any) => {
      setSchedules(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadSchedules(); }, []);

  const loadAttendances = async (scheduleId: number) => {
    const res = await api.attendances.bySchedule(scheduleId);
    setAttendances(res as AttendanceDto[]);
  };

  const openAttendance = async (schedule: ScheduleDto) => {
    setSelectedSchedule(schedule);
    await loadAttendances(schedule.id);
    setModalOpen(true);
  };

  const openBatchMark = (schedule: ScheduleDto) => {
    setSelectedSchedule(schedule);
    batchForm.resetFields();
    setBatchModalOpen(true);
  };

  const openEdit = (record: AttendanceDto) => {
    setEditingRecord(record);
    form.setFieldsValue({
      status: record.status,
      deductHours: record.hoursDeducted,
      notes: record.notes
    });
    setEditModalOpen(true);
  };

  const handleMark = async (values: any) => {
    if (!editingRecord || !selectedSchedule) return;
    try {
      await api.attendances.mark({
        scheduleId: selectedSchedule.id,
        studentId: editingRecord.studentId,
        ...values
      });
      message.success('考勤已记录');
      setEditModalOpen(false);
      await loadAttendances(selectedSchedule.id);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleBatchMark = async (values: any) => {
    if (!selectedSchedule) return;
    try {
      const attendanceList = attendances.map(a => ({
        scheduleId: selectedSchedule.id,
        studentId: a.studentId,
        status: values.status || 'Present',
        deductHours: values.status !== 'Absent',
        notes: values.notes
      }));
      const result: any = await api.attendances.batchMark({
        scheduleId: selectedSchedule.id,
        attendances: attendanceList
      });
      message.success(`批量考勤完成：成功${result.successCount}条，失败${result.failedCount}条`);
      setBatchModalOpen(false);
      await loadAttendances(selectedSchedule.id);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const statusColor: Record<string, string> = {
    Present: 'green', Absent: 'red', Late: 'orange', Leave: 'blue', NotMarked: 'default'
  };

  const scheduleColumns = [
    { title: '日期', key: 'date', render: (_: any, r: ScheduleDto) => dayjs(r.startTime).format('YYYY-MM-DD ddd') },
    { title: '时间', key: 'time', render: (_: any, r: ScheduleDto) =>
      `${dayjs(r.startTime).format('HH:mm')} - ${dayjs(r.endTime).format('HH:mm')}`
    },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '课时', dataIndex: 'durationHours', key: 'hours', render: (h: number) => `${h}课时` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) =>
      <Tag color={s === 'Scheduled' ? 'blue' : s === 'Completed' ? 'green' : s === 'Cancelled' ? 'red' : 'orange'}>{s}</Tag>
    },
    {
      title: '操作', key: 'action', render: (_: any, r: ScheduleDto) => (
        <Space>
          <Button size="small" icon={<CheckOutlined />} onClick={() => openAttendance(r)}>考勤</Button>
          <Button size="small" type="primary" icon={<InboxOutlined />} onClick={() => openBatchMark(r)}>批量</Button>
        </Space>
      )
    }
  ];

  const attendanceColumns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '考勤状态', dataIndex: 'status', key: 'status', render: (s: string) =>
      <Tag color={statusColor[s]}>{AttendanceStatusMap[s as keyof typeof AttendanceStatusMap]}</Tag>
    },
    { title: '是否扣课时', dataIndex: 'hoursDeducted', key: 'deducted', render: (v: boolean) =>
      v ? <Tag color="green">已扣</Tag> : <Tag color="default">未扣</Tag>
    },
    { title: '备注', dataIndex: 'notes', key: 'notes' },
    { title: '操作', key: 'action', render: (_: any, r: AttendanceDto) => (
      <Button size="small" icon={<EditOutlined />} type="link" onClick={() => openEdit(r)}>修改</Button>
    )}
  ];

  return (
    <div>
      <div className="page-title">考勤消课</div>
      <Card className="card-shadow">
        <Table
          rowKey="id"
          loading={loading}
          columns={scheduleColumns}
          dataSource={schedules}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal title={`考勤 - ${selectedSchedule?.className}`} open={modalOpen}
        onCancel={() => setModalOpen(false)} footer={null} width={700} destroyOnClose>
        <Table rowKey="id" columns={attendanceColumns} dataSource={attendances} pagination={false} size="small" />
      </Modal>

      <Modal title="批量考勤" open={batchModalOpen} onCancel={() => setBatchModalOpen(false)}
        onOk={() => batchForm.submit()} destroyOnClose>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchMark} initialValues={{ status: 'Present' }}>
          <Form.Item name="status" label="统一设置状态" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="Present">出勤（扣课时）</Radio>
              <Radio value="Absent">缺勤</Radio>
              <Radio value="Late">迟到</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="修改考勤" open={editModalOpen} onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()} destroyOnClose>
        <div style={{ marginBottom: 12 }}>
          <strong>学生：</strong>{editingRecord?.studentName}
        </div>
        <Form form={form} layout="vertical" onFinish={handleMark}>
          <Form.Item name="status" label="考勤状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Present">出勤</Select.Option>
              <Select.Option value="Absent">缺勤</Select.Option>
              <Select.Option value="Late">迟到</Select.Option>
              <Select.Option value="Leave">请假</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="deductHours" label="扣课时" valuePropName="checked">
            <Radio.Group>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const { Input } = Form;
