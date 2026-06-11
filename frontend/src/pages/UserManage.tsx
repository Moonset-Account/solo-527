import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, message, Typography, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const UserManage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers({
        role: roleFilter,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleMap: Record<string, { label: string; color: string }> = {
    admin: { label: '管理员', color: 'red' },
    hr: { label: 'HR', color: 'blue' },
    interviewer: { label: '面试官', color: 'purple' },
    candidate: { label: '候选人', color: 'green' },
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const info = roleMap[role] || { label: role, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const openAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        const res = await authApi.updateUser(editingUser.id, values);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await authApi.register(values);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authApi.deleteUser(id);
      if (res.success) {
        message.success('删除成功');
        loadUsers();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>用户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新增用户
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="筛选角色"
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(roleMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
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
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
      >
        <Form form={form} {...formItemLayout}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              {Object.entries(roleMap).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          {editingUser && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
