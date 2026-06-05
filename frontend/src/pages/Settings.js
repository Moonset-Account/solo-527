import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Space,
  message,
  Divider,
  Table,
  Modal,
  Tag,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { authAPI, membersAPI } from '../services/api';

const { Option } = Select;

function Settings() {
  const [passwordForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
    loadLevels();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await authAPI.listUsers();
      setUsers(res.data);
    } catch (error) {
      message.error('加载用户列表失败');
    }
  };

  const loadLevels = async () => {
    try {
      const res = await membersAPI.listLevels();
      setLevels(res.data);
    } catch (error) {
      message.error('加载会员等级失败');
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await authAPI.changePassword(values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();
      if (editingUser) {
        await authAPI.updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await authAPI.createUser(values);
        message.success('用户创建成功');
      }
      setUserModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error(editingUser ? '更新失败' : '创建失败');
    }
  };

  const handleAddLevel = () => {
    setEditingLevel(null);
    levelForm.resetFields();
    setLevelModalVisible(true);
  };

  const handleEditLevel = (level) => {
    setEditingLevel(level);
    levelForm.setFieldsValue(level);
    setLevelModalVisible(true);
  };

  const handleSaveLevel = async () => {
    try {
      const values = await levelForm.validateFields();
      if (editingLevel) {
        await membersAPI.updateLevel(editingLevel.id, values);
        message.success('等级更新成功');
      } else {
        await membersAPI.createLevel(values);
        message.success('等级创建成功');
      }
      setLevelModalVisible(false);
      loadLevels();
    } catch (error) {
      message.error(editingLevel ? '更新失败' : '创建失败');
    }
  };

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleLabels = {
          admin: '管理员',
          curator: '策展人',
          frontdesk: '前台',
          finance: '财务',
        };
        const colors = {
          admin: 'red',
          curator: 'blue',
          frontdesk: 'green',
          finance: 'purple',
        };
        return <Tag color={colors[role]}>{roleLabels[role]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const levelColumns = [
    {
      title: '等级名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '报名窗口(天)',
      dataIndex: 'booking_window_days',
      key: 'booking_window_days',
    },
    {
      title: '最大报名数',
      dataIndex: 'max_bookings_per_screening',
      key: 'max_bookings_per_screening',
    },
    {
      title: '年费(元)',
      dataIndex: 'annual_fee',
      key: 'annual_fee',
    },
    {
      title: '可带嘉宾数',
      dataIndex: 'max_guests',
      key: 'max_guests',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditLevel(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="系统设置说明"
          description="此处可以管理用户账号、修改密码、配置会员等级等系统参数。只有管理员角色可以访问用户管理和等级配置。"
          type="info"
          showIcon
        />

        <Card title={<Space><LockOutlined />修改密码</Space>}>
          <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical" style={{ maxWidth: 500 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="old_password"
                  label="当前密码"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                >
                  <Input.Password placeholder="请输入当前密码" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="new_password"
                  label="新密码"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                >
                  <Input.Password placeholder="请输入新密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirm_password"
                  label="确认新密码"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: '请确认新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="请再次输入新密码" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存密码
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card
          title={<Space><UserOutlined />用户管理</Space>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              新增用户
            </Button>
          }
        >
          <Table columns={userColumns} dataSource={users} rowKey="id" pagination={false} />
        </Card>

        <Card
          title={<Space><SettingOutlined />会员等级配置</Space>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLevel}>
              新增等级
            </Button>
          }
        >
          <Table columns={levelColumns} dataSource={levels} rowKey="id" pagination={false} />
        </Card>

        <Card title={<Space><MailOutlined />通知设置</Space>}>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="邮件通知" valuePropName="checked">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="短信通知" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="放映提醒(提前)" valuePropName="checked">
                  <Select defaultValue={24} style={{ width: '100%' }}>
                    <Option value={1}>1小时前</Option>
                    <Option value={6}>6小时前</Option>
                    <Option value={24}>24小时前</Option>
                    <Option value={48}>48小时前</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Space>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={userModalVisible}
        onOk={handleSaveUser}
        onCancel={() => setUserModalVisible(false)}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="full_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="curator">策展人</Option>
              <Option value="frontdesk">前台</Option>
              <Option value="finance">财务</Option>
            </Select>
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}
          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingLevel ? '编辑会员等级' : '新增会员等级'}
        open={levelModalVisible}
        onOk={handleSaveLevel}
        onCancel={() => setLevelModalVisible(false)}
      >
        <Form form={levelForm} layout="vertical">
          <Form.Item
            name="name"
            label="等级名称"
            rules={[{ required: true, message: '请输入等级名称' }]}
          >
            <Input placeholder="例如：普通会员、高级会员、VIP会员" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="booking_window_days"
                label="提前报名天数"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input type="number" placeholder="7" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_bookings_per_screening"
                label="单场最大报名数"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input type="number" placeholder="2" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="annual_fee"
                label="年费(元)"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input type="number" placeholder="365" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_guests"
                label="可带嘉宾数"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input type="number" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="等级说明">
            <Input.TextArea rows={3} placeholder="等级权益说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Settings;
