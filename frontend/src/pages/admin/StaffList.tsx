import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { User } from '@/types';
import client from '@/api/client';

const roleMap: Record<string, { color: string; label: string }> = {
  admin: { color: 'red', label: '管理员' },
  teacher: { color: 'blue', label: '教师' },
  parent: { color: 'green', label: '家长' },
};

export default function StaffList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/accounts/users/', { params: { page, role: 'admin,teacher' } });
      setData(res.data.results || res.data);
      setTotal(res.data.count || res.data.length);
    } catch {
      message.error('获取员工列表失败');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<User> = [
    {
      title: '姓名',
      key: 'name',
      render: (_, r) => `${r.first_name}${r.last_name}` || r.username,
    },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => {
        const s = roleMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const handleToggleActive = (record: User) => {
    Modal.confirm({
      title: record.is_active ? '确认停用此员工？' : '确认启用此员工？',
      onOk: async () => {
        try {
          await client.patch(`/accounts/users/${record.id}/`, { is_active: !record.is_active });
          message.success('操作成功');
          fetchData();
        } catch {
          message.error('操作失败');
        }
      },
    });
  };

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await client.post('/accounts/users/', values);
      message.success('添加员工成功');
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>员工管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加员工
        </Button>
      </div>
      <Table<User>
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
        title="添加员工"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="first_name" label="姓" rules={[{ required: true, message: '请输入姓' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="名" rules={[{ required: true, message: '请输入名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'teacher', label: '教师' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
