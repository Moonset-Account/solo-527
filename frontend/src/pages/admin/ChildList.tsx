import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Child, ClassGroup } from '@/types';
import { getChildren, getChild, createChild, updateChild, getClasses } from '@/api/children';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; label: string }> = {
  true: { color: 'green', label: '在园' },
  false: { color: 'red', label: '停园' },
};

export default function ChildList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Child[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [filterClass, setFilterClass] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<boolean | undefined>();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (filterClass !== undefined) params.class_group = filterClass;
      if (filterStatus !== undefined) params.is_active = filterStatus;
      const res = await getChildren(params);
      setData(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取儿童列表失败');
    }
    setLoading(false);
  }, [page, filterClass, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.results))
      .catch(() => {});
  }, []);

  const columns: ColumnsType<Child> = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (v: string) => (v === 'M' ? '男' : '女'),
    },
    { title: '班级', dataIndex: 'class_group_name', key: 'class_group_name' },
    { title: '入园日期', dataIndex: 'enrollment_date', key: 'enrollment_date' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => {
        const s = statusMap[String(v)];
        return s ? <Tag color={s.color}>{s.label}</Tag> : String(v);
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? '停园' : '恢复'}
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = async (record: Child) => {
    setEditingId(record.id);
    try {
      const detail = await getChild(record.id);
      form.setFieldsValue({
        ...detail,
        birth_date: detail.birth_date ? dayjs(detail.birth_date) : undefined,
        enrollment_date: detail.enrollment_date ? dayjs(detail.enrollment_date) : undefined,
        class_group: detail.class_group || undefined,
      });
      setModalOpen(true);
    } catch {
      message.error('获取儿童详情失败');
    }
  };

  const handleToggleActive = (record: Child) => {
    Modal.confirm({
      title: record.is_active ? '确认停园？' : '确认恢复在园？',
      onOk: async () => {
        try {
          await updateChild(record.id, { is_active: !record.is_active });
          message.success('操作成功');
          fetchData();
        } catch {
          message.error('操作失败');
        }
      },
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD'),
        enrollment_date: values.enrollment_date?.format('YYYY-MM-DD'),
      };
      if (editingId) {
        await updateChild(editingId, submitData);
        message.success('更新成功');
      } else {
        await createChild(submitData);
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="筛选班级"
            allowClear
            style={{ width: 160 }}
            value={filterClass}
            onChange={(v) => { setFilterClass(v); setPage(1); }}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            options={[
              { value: true, label: '在园' },
              { value: false, label: '停园' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加儿童
        </Button>
      </div>
      <Table<Child>
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
      <Modal
        title={editingId ? '编辑儿童' : '添加儿童'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select
              options={[
                { value: 'M', label: '男' },
                { value: 'F', label: '女' },
              ]}
            />
          </Form.Item>
          <Form.Item name="birth_date" label="出生日期" rules={[{ required: true, message: '请选择出生日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="class_group" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select
              placeholder="请选择班级"
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="enrollment_date" label="入园日期" rules={[{ required: true, message: '请选择入园日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="allergies" label="过敏信息">
            <Input.TextArea rows={2} placeholder="如有过敏请填写，无则留空" />
          </Form.Item>
          <Form.Item name="medical_notes" label="医疗备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="emergency_contact" label="紧急联系人">
            <Input />
          </Form.Item>
          <Form.Item name="emergency_phone" label="紧急联系电话">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
