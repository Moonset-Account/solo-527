import { useState, useEffect, useCallback } from 'react';
import { Form, Select, DatePicker, Input, Button, Card, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { Child, LeaveRequest } from '@/types';
import { getChildren } from '@/api/children';
import { createLeave, getLeaves } from '@/api/finance';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审批' },
  approved: { color: 'green', label: '已批准' },
  rejected: { color: 'red', label: '已拒绝' },
};

export default function LeaveRequestPage() {
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();

  useEffect(() => {
    getChildren({ is_active: true })
      .then((res) => setChildren(res.results))
      .catch(() => message.error('获取儿童列表失败'));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaves({ page });
      setData(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取请假记录失败');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      const submitData = {
        child: values.child,
        start_date: (values.start_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
        end_date: (values.end_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
        reason: values.reason,
      };
      await createLeave(submitData);
      message.success('请假申请已提交');
      form.resetFields();
      fetchData();
    } catch {
      message.error('提交失败');
    }
  };

  const columns: ColumnsType<LeaveRequest> = [
    { title: '幼儿', dataIndex: 'child_name', key: 'child_name' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = statusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: '审批备注',
      dataIndex: 'review_remark',
      key: 'review_remark',
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>请假申请</h2>
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={onFinish}
          initialValues={{ start_date: dayjs(), end_date: dayjs() }}
        >
          <Form.Item name="child" label="选择孩子" rules={[{ required: true, message: '请选择孩子' }]}>
            <Select
              placeholder="请选择孩子"
              style={{ width: 150 }}
              options={children.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="reason" label="原因" rules={[{ required: true, message: '请输入请假原因' }]}>
            <Input placeholder="请输入请假原因" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Table<LeaveRequest>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </div>
  );
}
