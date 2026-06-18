import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';
import {
  User,
  UserRole,
  UserRoleLabels,
  PageResult,
} from '../../types';

const { Option } = Select;

interface QueryParams {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  keyword?: string;
  isActive?: boolean;
}

const UsersPage = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [queryParams, setQueryParams] = useState<QueryParams>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const mergedParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...queryParams,
        ...params,
      };
      const res = await request.get<any, PageResult<User>>('/users', {
        params: mergedParams,
      });
      const result = res as unknown as PageResult<User>;
      setData(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ page: 1, ...queryParams });
  };

  const handleReset = () => {
    setQueryParams({});
    setPagination({ current: 1, pageSize: 10, total: 0 });
    fetchData({ page: 1 });
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/users/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  const handleToggleActive = async (record: User, checked: boolean) => {
    try {
      await request.put(`/users/${record.id}`, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      fetchData();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        const { password, ...updateData } = values;
        await request.put(`/users/${editingRecord.id}`, updateData);
        message.success('更新成功');
      } else {
        await request.post('/users', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const roleColorMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'magenta',
    [UserRole.MANAGER]: 'purple',
    [UserRole.STAFF]: 'blue',
    [UserRole.VOLUNTEER]: 'cyan',
    [UserRole.CUSTOMER]: 'green',
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColorMap[role]}>
          {UserRoleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      render: (value) => value || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value, record) => (
        <Switch
          checked={value}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.role !== UserRole.ADMIN && (
            <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索用户名/姓名/手机/邮箱"
          style={{ width: 240 }}
          allowClear
          onChange={(e) => setQueryParams((prev) => ({ ...prev, keyword: e.target.value }))}
        />
        <Select
          placeholder="选择角色"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, role: value }))}
        >
          {Object.values(UserRole).map((role) => (
            <Option key={role} value={role}>
              {UserRoleLabels[role]}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="选择状态"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, isActive: value }))}
        >
          <Option value={true}>启用</Option>
          <Option value={false}>禁用</Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
            fetchData({ page, pageSize });
          },
        }}
      />

      <Modal
        title={editingRecord ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingRecord} />
          </Form.Item>
          {!editingRecord && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {Object.values(UserRole).map((role) => (
                <Option key={role} value={role}>
                  {UserRoleLabels[role]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
