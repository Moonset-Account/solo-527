import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LoginRequest, LoginResponse, UserRole } from '../../types';
import request from '../../utils/request';

const { Title, Text } = Typography;

const getHomePageByRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.STAFF:
      return '/admin/appointments';
    case UserRole.MANAGER:
      return '/manager/dashboard';
    case UserRole.VOLUNTEER:
      return '/manager/foster-records';
    case UserRole.CUSTOMER:
      return '/customer/appointments';
    default:
      return '/login';
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const response = await request.post<LoginResponse>('/auth/login', values);
      const data = response as unknown as LoginResponse;
      setAuth(data);
      message.success('登录成功');
      navigate(getHomePageByRole(data.user.role), { replace: true });
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            宠物店管理系统
          </Title>
          <Title level={5} type="secondary" style={{ fontWeight: 'normal' }}>
            Pet Shop Management System
          </Title>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认测试账号（密码：admin123）：
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              admin / manager / staff01 / volunteer01 / customer01
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
