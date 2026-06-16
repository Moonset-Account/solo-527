import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  Select,
  Table,
  Modal,
  Form,
  App as AntdApp,
  Tag,
  Avatar,
  Empty,
  Tooltip,
  Switch,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  KeyOutlined,
  StopOutlined,
  PlayCircleOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { userApi } from '@/api/index.js';
import { ROLE, ROLE_LABELS, hasRole } from '@/utils/auth.js';
import { fmtDateTime, parsePagination } from '@/utils/format.js';

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_COLORS = {
  SUPER_ADMIN: 'red',
  WAREHOUSE_MANAGER: 'purple',
  PURCHASE_STAFF: 'blue',
  QC_STAFF: 'cyan',
  SUPPLIER: 'green',
  VIEWER: 'default',
};

export default function UserList() {
  const { message: msg, modal } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({});

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const isSuperAdmin = hasRole(ROLE.SUPER_ADMIN);

  const fetchList = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await userApi.list({ page, pageSize, ...filters });
      const data = res.data?.list || res.data?.records || [];
      setList(data);
      setPagination(parsePagination(res.data));
    } catch (e) {
      msg.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchList();
    }
  }, [filters]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    fetchList(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      await userApi.create(values);
      msg.success('创建成功');
      setAddModalOpen(false);
      fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      if (e?.errorFields) return;
      msg.error('创建失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentUser(record);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      role: record.role,
      email: record.email,
      phone: record.phone,
      supplierId: record.supplierId,
    });
    setEditModalOpen(true);
  };

  const handleEditOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      await userApi.update(currentUser.id, values);
      msg.success('更新成功');
      setEditModalOpen(false);
      fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      if (e?.errorFields) return;
      msg.error('更新失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleResetPwd = (record) => {
    setCurrentUser(record);
    resetForm.resetFields();
    setResetModalOpen(true);
  };

  const handleResetPwdOk = async () => {
    try {
      const values = await resetForm.validateFields();
      setConfirmLoading(true);
      await userApi.resetPassword(currentUser.id, values.newPassword);
      msg.success('密码重置成功');
      setResetModalOpen(false);
    } catch (e) {
      if (e?.errorFields) return;
      msg.error('重置失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleToggleActive = (record) => {
    const action = record.isActive ? '禁用' : '启用';
    modal.confirm({
      title: `${action}用户`,
      content: `确定要${action}用户「${record.name}」吗？${action === '禁用' ? '禁用后该用户将无法登录系统。' : ''}`,
      okText: `确认${action}`,
      cancelText: '取消',
      okButtonProps: { danger: record.isActive },
      onOk: async () => {
        try {
          if (record.isActive) {
            await userApi.disable(record.id);
          } else {
            await userApi.enable(record.id);
          }
          msg.success(`${action}成功`);
          fetchList(pagination.current, pagination.pageSize);
        } catch (e) {}
      },
    });
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (t, r) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: ROLE_COLORS[r.role] }} />
          <span>{t}</span>
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (t) => (
        <Tag color={ROLE_COLORS[t]} style={{ margin: 0 }}>
          {ROLE_LABELS[t] || t}
        </Tag>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      render: (t) => t ? <span><MailOutlined style={{ marginRight: 4 }} />{t}</span> : '-',
    },
    {
      title: '手机',
      dataIndex: 'phone',
      width: 130,
      render: (t) => t ? <span><PhoneOutlined style={{ marginRight: 4 }} />{t}</span> : '-',
    },
    {
      title: '所属供应商',
      dataIndex: 'supplierName',
      width: 150,
      render: (t) => t || '-',
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      width: 160,
      render: (t) => t ? fmtDateTime(t) : '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (t) => (
        <Tag color={t ? 'green' : 'default'} style={{ margin: 0 }}>
          {t ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
            />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPwd(r)}
            />
          </Tooltip>
          <Tooltip title={r.isActive ? '禁用' : '启用'}>
            <Button
              type="text"
              size="small"
              danger={r.isActive}
              icon={r.isActive ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleActive(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="app-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', maxWidth: 500 }}>
          <Alert
            type="error"
            showIcon
            message="403 - 无权限访问"
            description="您没有权限访问用户管理页面。此功能仅超级管理员可用。"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Card
        title={<Title level={4} style={{ margin: 0 }}>用户管理</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchList()}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用户
            </Button>
          </Space>
        }
      >
        <Card size="small" style={{ marginBottom: 16 }} variant="borderless">
          <Space size="middle" wrap>
            <Input
              placeholder="用户名/姓名/邮箱"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 240 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={handleSearch}
            />
            <Select
              placeholder="角色"
              allowClear
              style={{ width: 160 }}
              value={filters.role}
              onChange={(v) => setFilters({ ...filters, role: v })}
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              value={filters.isActive}
              onChange={(v) => setFilters({ ...filters, isActive: v })}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Space>
        </Card>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="暂无用户" /> }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="新增用户"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddOk}
        confirmLoading={confirmLoading}
        okText="创建"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="登录账号" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="真实姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="选择角色">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="初始密码"
                name="password"
                rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '密码至少6位' }]}
              >
                <Input.Password placeholder="至少6位" prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="邮箱" name="email">
                <Input placeholder="电子邮箱" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机" name="phone">
                <Input placeholder="手机号码" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="所属供应商" name="supplierId">
            <Select placeholder="仅供应商角色需要选择" allowClear showSearch optionFilterProp="children">
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditOk}
        confirmLoading={confirmLoading}
        okText="保存"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="用户名" name="username">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="邮箱" name="email">
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="手机" name="phone">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所属供应商" name="supplierId">
                <Select placeholder="仅供应商角色需要选择" allowClear showSearch optionFilterProp="children">
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={resetModalOpen}
        onCancel={() => setResetModalOpen(false)}
        onOk={handleResetPwdOk}
        confirmLoading={confirmLoading}
        okText="确认重置"
        cancelText="取消"
        width={420}
      >
        {currentUser && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`即将为用户「${currentUser.name}」重置密码`}
          />
        )}
        <Form form={resetForm} layout="vertical">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="至少6位" prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入新密码" prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
