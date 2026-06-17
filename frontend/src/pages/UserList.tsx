import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Form,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { userApi } from '../api';
import type { User } from '../types';
import { UserRole } from '../types';
import { userRoleText, formatDate } from '../utils';

export default function UserList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<UserRole | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await userApi.getList({
        page,
        pageSize,
        keyword: keyword || undefined,
        role,
      });
      if (res.success) {
        setData(res.data?.items || []);
        setTotal(res.data?.totalCount || 0);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setRole(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleCreate = () => {
    setModalType('create');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setModalType('edit');
    setCurrentUser(record);
    form.setFieldsValue({
      userName: record.userName,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      role: record.role,
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await userApi.delete(id);
      if (res.success) {
        message.success('删除成功');
        loadData();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    if (modalType === 'create') {
      userApi
        .create(values)
        .then((res) => {
          if (res.success) {
            message.success('创建成功');
            setModalVisible(false);
            loadData();
          } else {
            message.error(res.message || '创建失败');
          }
        })
        .catch(() => {
          message.error('创建失败');
        });
    } else {
      userApi
        .update(currentUser!.id, values)
        .then((res) => {
          if (res.success) {
            message.success('更新成功');
            setModalVisible(false);
            loadData();
          } else {
            message.error(res.message || '更新失败');
          }
        })
        .catch(() => {
          message.error('更新失败');
        });
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (r: UserRole) => <Tag>{userRoleText[r]}</Tag>,
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
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) =>
        active ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => formatDate(t),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form layout="inline">
          <Form.Item label="关键字">
            <Input
              placeholder="搜索用户名/姓名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item label="角色">
            <Select
              placeholder="全部角色"
              value={role}
              onChange={setRole}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(userRoleText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={modalType === 'create' ? '新建用户' : '编辑用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="userName"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
            </Form.Item>
            <Form.Item
              name="fullName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </div>
          {modalType === 'create' && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="email"
              label="邮箱"
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="电话"
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
          </div>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {Object.entries(userRoleText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {modalType === 'edit' && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Select>
                <Select.Option value={true}>启用</Select.Option>
                <Select.Option value={false}>禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
