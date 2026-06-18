import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Modal, Form, Input, Radio, message, Select } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { LeaveRecordDto, LeaveStatusMap } from '../../types';

export default function AdminLeaves() {
  const [data, setData] = useState<LeaveRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [processOpen, setProcessOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<LeaveRecordDto | null>(null);
  const [form] = Form.useForm();

  const loadData = (status: string = statusFilter) => {
    setLoading(true);
    api.leaves.list({ status }).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(statusFilter); }, [statusFilter]);

  const handleProcess = (record: LeaveRecordDto) => {
    setCurrentRecord(record);
    form.resetFields();
    setProcessOpen(true);
  };

  const submitProcess = async (values: any) => {
    if (!currentRecord) return;
    try {
      await api.leaves.process({
        leaveId: currentRecord.id,
        approve: values.approve,
        deductHours: values.deductHours || false,
        rejectReason: values.rejectReason
      });
      message.success(values.approve ? '已批准请假' : '已拒绝请假');
      setProcessOpen(false);
      loadData(statusFilter);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const statusColor: Record<string, string> = {
    Pending: 'orange', Approved: 'green', Rejected: 'red', Cancelled: 'default'
  };

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '课程', dataIndex: 'className', key: 'className' },
    { title: '上课时间', key: 'time', render: (_: any, r: LeaveRecordDto) =>
      dayjs(r.scheduleStartTime).format('YYYY-MM-DD HH:mm')
    },
    { title: '请假原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '提交时间', key: 'createdAt', render: (_: any, r: LeaveRecordDto) =>
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm')
    },
    { title: '是否扣课时', dataIndex: 'hoursDeducted', key: 'deducted', render: (v: boolean) =>
      v ? <Tag color="green">已扣</Tag> : <Tag color="default">未扣</Tag>
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) =>
      <Tag color={statusColor[s]}>{LeaveStatusMap[s as keyof typeof LeaveStatusMap]}</Tag>
    },
    {
      title: '操作', key: 'action', render: (_: any, r: LeaveRecordDto) =>
        r.status === 'Pending' ? (
          <Button size="small" type="primary" onClick={() => handleProcess(r)}>处理</Button>
        ) : null
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>请假审批</div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 140 }}
          options={[
            { value: 'Pending', label: '待审批' },
            { value: 'Approved', label: '已批准' },
            { value: 'Rejected', label: '已拒绝' },
            { value: '', label: '全部' }
          ]}
        />
      </div>
      <Card className="card-shadow">
        <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="审批请假申请" open={processOpen} onCancel={() => setProcessOpen(false)}
        onOk={() => form.submit()} destroyOnClose>
        {currentRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <div><strong>学生：</strong>{currentRecord.studentName}</div>
            <div><strong>课程：</strong>{currentRecord.className}</div>
            <div><strong>时间：</strong>{dayjs(currentRecord.scheduleStartTime).format('YYYY-MM-DD HH:mm')}</div>
            <div><strong>原因：</strong>{currentRecord.reason}</div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={submitProcess} initialValues={{ approve: true, deductHours: false }}>
          <Form.Item name="approve" label="审批结果" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={true}><CheckOutlined style={{ color: '#52c41a' }} /> 批准</Radio>
              <Radio value={false}><CloseOutlined style={{ color: '#ff4d4f' }} /> 拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.approve !== cur.approve}>
            {({ getFieldValue }) => (
              getFieldValue('approve') ? (
                <Form.Item name="deductHours" label="是否扣课时" valuePropName="checked">
                  <Radio.Group>
                    <Radio value={true}>是（扣除相应课时）</Radio>
                    <Radio value={false}>否（不扣课时）</Radio>
                  </Radio.Group>
                </Form.Item>
              ) : (
                <Form.Item name="rejectReason" label="拒绝原因" rules={[{ required: true, message: '请填写拒绝原因' }]}>
                  <Input.TextArea rows={3} placeholder="请填写拒绝原因" />
                </Form.Item>
              )
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
