import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Avatar,
  Tag,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  Table,
  Descriptions,
  App as AntdApp,
  Divider,
  Empty,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  EditOutlined,
  SaveOutlined,
  HistoryOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/index.js';
import { ROLE_LABELS, ROLE } from '@/utils/auth.js';
import { fmtDateTime } from '@/utils/format.js';
import { authApi, userApi } from '@/api/index.js';

const { Title, Text, Paragraph } = Typography;

const ROLE_COLORS = {
  SUPER_ADMIN: 'red',
  WAREHOUSE_MANAGER: 'purple',
  PURCHASE_STAFF: 'blue',
  QC_STAFF: 'cyan',
  SUPPLIER: 'green',
  VIEWER: 'default',
};

const LOG_ACTIONS = {
  CREATE: '新建',
  UPDATE: '更新',
  DELETE: '删除',
  LOGIN: '登录',
  LOGOUT: '登出',
  UPLOAD: '上传',
  DOWNLOAD: '下载',
  APPROVE: '审批',
  REJECT: '驳回',
};

export default function Profile() {
  const { message: msg } = AntdApp.useApp();
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);

  const [infoForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [infoSaving, setInfoSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    if (user) {
      infoForm.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchLogs(1, 10);
  }, []);

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLogsLoading(true);
    try {
      const res = await userApi.operationLogs({ page, pageSize });
      const data = res.data?.list || res.data?.records || [];
      setLogs(data);
      setLogsPagination({
        current: page,
        pageSize,
        total: res.data?.total || data.length,
      });
    } catch (e) {
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    try {
      const values = await infoForm.validateFields();
      setInfoSaving(true);
      const res = await userApi.updateProfile(values);
      const updatedUser = res.data || { ...user, ...values };
      updateUser(updatedUser);
      msg.success('个人信息更新成功');
    } catch (e) {
      if (e?.errorFields) return;
      msg.error('更新失败');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      setPwdSaving(true);
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      msg.success('密码修改成功');
      pwdForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      msg.error(e?.message || '密码修改失败');
    } finally {
      setPwdSaving(false);
    }
  };

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (t) => fmtDateTime(t),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 100,
      render: (t) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {LOG_ACTIONS[t] || t}
        </Tag>
      ),
    },
    {
      title: '实体类型',
      dataIndex: 'entityType',
      width: 130,
      render: (t) => t || '-',
    },
    {
      title: '实体名称/编号',
      dataIndex: 'entityName',
      render: (t, r) => (
        <Space>
          {t || r.entityNo || '-'}
          {r.entityId && (
            <Text type="secondary" style={{ fontSize: 12 }}>(ID: {r.entityId})</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 140,
      render: (t) => (
        <span>
          <GlobalOutlined style={{ marginRight: 6 }} />
          {t || '-'}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Card variant="borderless">
          <Title level={5} style={{ marginTop: 0, marginBottom: 20 }}>
            <EditOutlined style={{ marginRight: 8 }} />
            编辑个人信息
          </Title>
          <Form
            form={infoForm}
            layout="vertical"
            style={{ maxWidth: 500 }}
          >
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" prefix={<UserOutlined />} size="large" />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input placeholder="请输入邮箱" prefix={<MailOutlined />} size="large" />
            </Form.Item>
            <Form.Item label="手机" name="phone">
              <Input placeholder="请输入手机号码" prefix={<PhoneOutlined />} size="large" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={infoSaving}
                  onClick={handleSaveInfo}
                  size="large"
                >
                  保存修改
                </Button>
                <Button onClick={() => infoForm.resetFields()} size="large">
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Card variant="borderless">
          <Title level={5} style={{ marginTop: 0, marginBottom: 20 }}>
            <LockOutlined style={{ marginRight: 8 }} />
            修改登录密码
          </Title>
          <Form
            form={pwdForm}
            layout="vertical"
            style={{ maxWidth: 500 }}
          >
            <Form.Item
              label="原密码"
              name="oldPassword"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password placeholder="请输入原密码" prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="至少6位，建议包含字母和数字" prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
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
              <Input.Password placeholder="请再次输入新密码" prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                danger
                icon={<SaveOutlined />}
                loading={pwdSaving}
                onClick={handleChangePassword}
                size="large"
              >
                确认修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'logs',
      label: '我的操作日志',
      children: (
        <Card variant="borderless">
          <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
            <HistoryOutlined style={{ marginRight: 8 }} />
            最近操作记录
          </Title>
          <Table
            rowKey="id"
            loading={logsLoading}
            dataSource={logs}
            columns={logColumns}
            locale={{ emptyText: <Empty description="暂无操作记录" /> }}
            pagination={{
              ...logsPagination,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条记录`,
              onChange: (page, pageSize) => fetchLogs(page, pageSize),
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="app-page">
      <Row gutter={24}>
        <Col xs={24} md={8} lg={7}>
          <Card style={{ textAlign: 'center' }}>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              style={{
                background: ROLE_COLORS[user?.role] || '#1890ff',
                fontSize: 48,
                marginBottom: 16,
              }}
            />
            <Title level={4} style={{ marginBottom: 8 }}>
              {user?.name || '未设置姓名'}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              @{user?.username || 'username'}
            </Text>
            <Tag
              color={ROLE_COLORS[user?.role]}
              style={{ fontSize: 13, padding: '2px 12px' }}
            >
              {ROLE_LABELS[user?.role] || user?.role}
            </Tag>

            <Divider style={{ margin: '20px 0' }} />

            <Descriptions column={1} size="small" contentStyle={{ color: '#595959' }}>
              {user?.email && (
                <Descriptions.Item label="邮箱">
                  <MailOutlined style={{ marginRight: 6 }} />
                  {user.email}
                </Descriptions.Item>
              )}
              {user?.phone && (
                <Descriptions.Item label="手机">
                  <PhoneOutlined style={{ marginRight: 6 }} />
                  {user.phone}
                </Descriptions.Item>
              )}
              {user?.supplierName && (
                <Descriptions.Item label="所属供应商">
                  <ShopOutlined style={{ marginRight: 6 }} />
                  {user.supplierName}
                </Descriptions.Item>
              )}
              {user?.lastLoginAt && (
                <Descriptions.Item label="最后登录">
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  {fmtDateTime(user.lastLoginAt)}
                </Descriptions.Item>
              )}
              {user?.createdAt && (
                <Descriptions.Item label="账号创建">
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  {fmtDateTime(user.createdAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16} lg={17}>
          <Card variant="borderless">
            <Tabs defaultActiveKey="info" items={tabItems} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
