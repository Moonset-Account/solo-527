import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import type { User } from '@/types';
import { getUserList, createUser, updateUser, getDepartmentList } from '@/api/user';
import { roleMap, formatDateTime } from '@/utils';

const { Option } = Select;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<string | undefined>();
  const [department, setDepartment] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersResult, deptsResult] = await Promise.all([
        getUserList({ page, pageSize, keyword, role, department }),
        getDepartmentList(),
      ]);
      setUsers(usersResult.list);
      setTotal(usersResult.total);
      setDepartments(deptsResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, keyword, role, department]);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await createUser(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <UserOutlined />
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-gray-400">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const color = role === 'SYS_ADMIN' ? 'purple' : 
                      role === 'OP_ADMIN' ? 'blue' : 
                      role === 'FIN_ADMIN' ? 'green' : 'default';
        return <Tag color={color}>{roleMap[role] || role}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">用户管理</h2>
        <p className="text-gray-500 text-sm">管理系统用户和权限</p>
      </div>

      <Card 
        variant="borderless"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增用户
          </Button>
        }
      >
        <div className="flex items-center gap-4 mb-4">
          <Input.Search
            placeholder="搜索用户名/姓名/邮箱"
            allowClear
            style={{ width: 240 }}
            onSearch={setKeyword}
            onChange={(e) => !e.target.value && setKeyword('')}
          />
          <Select
            placeholder="角色筛选"
            allowClear
            style={{ width: 140 }}
            value={role}
            onChange={(val) => { setRole(val); setPage(1); }}
          >
            <Option value="USER">普通用户</Option>
            <Option value="OP_ADMIN">运营管理员</Option>
            <Option value="FIN_ADMIN">财务管理员</Option>
            <Option value="SYS_ADMIN">系统管理员</Option>
          </Select>
          <Select
            placeholder="部门筛选"
            allowClear
            style={{ width: 140 }}
            value={department}
            onChange={(val) => { setDepartment(val); setPage(1); }}
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            保存
          </Button>,
        ]}
        width={500}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="登录账号" disabled={!!editingUser} />
            </Form.Item>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="真实姓名" />
            </Form.Item>
          </div>

          {!editingUser && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="默认 123456" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              label="重置密码"
              name="password"
            >
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="邮箱"
              name="email"
              rules={[{ type: 'email', message: '请输入有效邮箱' }]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item
              label="部门"
              name="department"
              rules={[{ required: true, message: '请选择部门' }]}
            >
              <Select>
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="USER">普通用户</Option>
              <Option value="OP_ADMIN">运营管理员</Option>
              <Option value="FIN_ADMIN">财务管理员</Option>
              <Option value="SYS_ADMIN">系统管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
