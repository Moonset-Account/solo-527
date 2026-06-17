import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Space,
  Spin,
  Empty,
  message,
  Select,
  ColumnsType,
  Avatar,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { userApi } from '@/api';
import { User, UserRole, Guid } from '@/types';
import { USER_ROLE_COLORS, USER_ROLE_NAMES } from '@/constants/mappings';

const { Option } = Select;

const columns: ColumnsType<User> = [
  {
    title: '用户',
    key: 'user',
    width: 240,
    render: (_, record) => (
      <Space>
        <Avatar
          style={{
            backgroundColor: USER_ROLE_COLORS[record.role]
              .replace('magenta', '#eb2f96')
              .replace('geekblue', '#2f54eb')
              .replace('purple', '#722ed1')
              .replace('gold', '#faad14'),
            verticalAlign: 'middle',
          }}
          icon={<UserOutlined />}
        />
        <Space direction="vertical" size={0}>
          <strong>{record.name || '-'}</strong>
          <span style={{ fontSize: 12, color: '#888' }}>@{record.username || '-'}</span>
        </Space>
      </Space>
    ),
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 140,
    render: (v: UserRole) => <Tag color={USER_ROLE_COLORS[v]}>{USER_ROLE_NAMES[v]}</Tag>,
  },
  {
    title: '部门',
    dataIndex: 'department',
    key: 'department',
    width: 160,
    render: (v) =>
      v ? (
        <Space>
          <ApartmentOutlined style={{ color: '#1677ff' }} />
          <span>{v}</span>
        </Space>
      ) : (
        '-'
      ),
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 220,
    render: (v) =>
      v ? (
        <Tooltip title={v}>
          <Space>
            <MailOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: '#1677ff' }}>{v}</span>
          </Space>
        </Tooltip>
      ) : (
        '-'
      ),
  },
  {
    title: '电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 160,
    render: (v) =>
      v ? (
        <Space>
          <PhoneOutlined style={{ color: '#fa8c16' }} />
          <span>{v}</span>
        </Space>
      ) : (
        '-'
      ),
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100,
    render: (v) => (v ? <Tag color="success">正常</Tag> : <Tag color="error">停用</Tag>),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
  },
];

const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: UserRole.Admin, label: USER_ROLE_NAMES[UserRole.Admin] },
  { value: UserRole.Technician, label: USER_ROLE_NAMES[UserRole.Technician] },
  { value: UserRole.Operator, label: USER_ROLE_NAMES[UserRole.Operator] },
  { value: UserRole.Manager, label: USER_ROLE_NAMES[UserRole.Manager] },
];

function Users() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      let data: User[];
      if (roleFilter === 'all') {
        data = await userApi.getAll();
      } else {
        data = await userApi.getByRole(roleFilter);
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const counts: Record<string, number> = {
    all: users.length,
  };

  users.forEach((u) => {
    counts[u.role] = (counts[u.role] || 0) + 1;
  });

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: '#1677ff' }} />
            <span>用户列表</span>
            <span style={{ color: '#888', fontSize: 12 }}>（只读）</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
              style={{ width: 160 }}
              options={FILTER_OPTIONS.map((o) => ({
                label: (
                  <Space>
                    <span>{o.label}</span>
                    <Tag color="blue" style={{ margin: 0 }}>
                      {counts[o.value] ?? 0}
                    </Tag>
                  </Space>
                ),
                value: o.value,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {FILTER_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
            const color = USER_ROLE_COLORS[o.value as UserRole];
            return (
              <Col xs={24} sm={12} md={6} key={o.value}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => setRoleFilter(o.value)}
                  style={{
                    cursor: 'pointer',
                    borderColor: roleFilter === o.value ? '#1677ff' : undefined,
                    boxShadow: roleFilter === o.value ? '0 0 0 2px rgba(22,119,255,0.1)' : undefined,
                  }}
                >
                  <Space style={{ width: '100%' }} justify="space-between">
                    <Tag color={color}>{o.label}</Tag>
                    <strong style={{ fontSize: 18 }}>{counts[o.value] ?? 0}</strong>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        {users.length === 0 ? (
          <Empty description="暂无用户数据" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={users}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 名用户` }}
          />
        )}
      </Card>
    </Spin>
  );
}

export default Users;
