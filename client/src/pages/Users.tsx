import { Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { User, UserRole } from '../types';

const roleMap: Record<UserRole, { color: string; text: string }> = {
  Admin: { color: 'magenta', text: '管理员' },
  Technician: { color: 'blue', text: '技术员' },
  Operator: { color: 'green', text: '操作员' },
  Manager: { color: 'purple', text: '经理' },
};

const mockData: User[] = [];

const Users: React.FC = () => {
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
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
      render: (role: UserRole) => {
        const r = roleMap[role];
        return <Tag color={r.color}>{r.text}</Tag>;
      },
      filters: Object.entries(roleMap).map(([key, val]) => ({
        text: val.text,
        value: key,
      })),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>编辑</a>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建用户
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索用户名/姓名"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
        />
        <Select placeholder="选择角色" style={{ width: 160 }} allowClear>
          {Object.entries(roleMap).map(([key, val]) => (
            <Select.Option key={key} value={key}>
              {val.text}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary">搜索</Button>
      </Space>
      <Table<User>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default Users;
