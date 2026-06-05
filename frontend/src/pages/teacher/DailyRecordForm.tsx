import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, TimePicker, Upload, message, Table, Modal, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Child, DailyRecord } from '@/types';
import { getChildren, getClasses } from '@/api/children';
import { getDailyRecords, createDailyRecord, updateDailyRecord, uploadPhoto } from '@/api/records';
import dayjs from 'dayjs';

const moodMap: Record<string, string> = { happy: '开心', calm: '平静', fussy: '烦躁', crying: '哭闹' };
const appetiteMap: Record<string, string> = { good: '好', normal: '一般', poor: '差' };
const napQualityMap: Record<string, string> = { good: '好', normal: '一般', poor: '差' };

export default function DailyRecordForm() {
  const [form] = Form.useForm();
  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    getChildren({ is_active: true })
      .then((res) => setChildren(res.results))
      .catch(() => message.error('获取儿童列表失败'));
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const res = await getDailyRecords({ date: today, page });
      setRecords(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取记录失败');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      const submitData = {
        ...values,
        date: (values.date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
        nap_start: (values.nap_start as [dayjs.Dayjs, dayjs.Dayjs])?.[0]?.format('HH:mm'),
        nap_end: (values.nap_end as [dayjs.Dayjs, dayjs.Dayjs])?.[1]?.format('HH:mm'),
      };
      if (editingId) {
        await updateDailyRecord(editingId, submitData);
        message.success('更新成功');
      } else {
        await createDailyRecord(submitData);
        message.success('保存成功');
      }
      setEditingId(null);
      form.resetFields();
      fetchRecords();
    } catch {
      message.error('保存失败');
    }
  };

  const handleEdit = (record: DailyRecord) => {
    setEditingId(record.id);
    form.setFieldsValue({
      child: record.child,
      date: record.date ? dayjs(record.date) : dayjs(),
      mood: record.mood,
      appetite: record.appetite,
      nap_quality: record.nap_quality,
      breakfast: record.breakfast,
      lunch: record.lunch,
      snack: record.snack,
      activities: record.activities,
      notes: record.notes,
    });
  };

  const handlePhotoUpload = async (file: File, recordId: number) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('record', String(recordId));
    try {
      await uploadPhoto(formData);
      message.success('照片上传成功');
      fetchRecords();
    } catch {
      message.error('照片上传失败');
    }
  };

  const columns: ColumnsType<DailyRecord> = [
    { title: '幼儿', dataIndex: 'child_name', key: 'child_name' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    {
      title: '情绪',
      dataIndex: 'mood',
      key: 'mood',
      render: (v: string) => moodMap[v] || v,
    },
    {
      title: '食欲',
      dataIndex: 'appetite',
      key: 'appetite',
      render: (v: string) => appetiteMap[v] || v,
    },
    {
      title: '午睡质量',
      dataIndex: 'nap_quality',
      key: 'nap_quality',
      render: (v: string) => napQualityMap[v] || v,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>每日记录</h2>
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ date: dayjs(), mood: 'happy', appetite: 'good' }}
        >
          <Form.Item name="child" label="选择儿童" rules={[{ required: true, message: '请选择儿童' }]}>
            <Select
              placeholder="请选择儿童"
              showSearch
              optionFilterProp="label"
              options={children.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="mood" label="情绪" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'happy', label: '开心' },
                { value: 'calm', label: '平静' },
                { value: 'fussy', label: '烦躁' },
                { value: 'crying', label: '哭闹' },
              ]}
            />
          </Form.Item>
          <Form.Item name="appetite" label="食欲" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'good', label: '好' },
                { value: 'normal', label: '一般' },
                { value: 'poor', label: '差' },
              ]}
            />
          </Form.Item>
          <Form.Item name="nap_time" label="午休时间">
            <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="nap_quality" label="午睡质量">
            <Select
              allowClear
              options={[
                { value: 'good', label: '好' },
                { value: 'normal', label: '一般' },
                { value: 'poor', label: '差' },
              ]}
            />
          </Form.Item>
          <Form.Item name="breakfast" label="早餐">
            <Input.TextArea rows={2} placeholder="早餐情况" />
          </Form.Item>
          <Form.Item name="lunch" label="午餐">
            <Input.TextArea rows={2} placeholder="午餐情况" />
          </Form.Item>
          <Form.Item name="snack" label="点心">
            <Input.TextArea rows={2} placeholder="点心情况" />
          </Form.Item>
          <Form.Item name="activities" label="活动记录">
            <Input.TextArea rows={3} placeholder="请记录今日活动内容" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="其他需要记录的事项" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingId ? '更新记录' : '保存记录'}
            </Button>
            {editingId && (
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setEditingId(null);
                  form.resetFields();
                }}
              >
                取消编辑
              </Button>
            )}
          </Form.Item>
        </Form>
      </Card>

      <h3 style={{ marginBottom: 16 }}>今日记录</h3>
      <Table<DailyRecord>
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
        }}
      />
    </div>
  );
}
