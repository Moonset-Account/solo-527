import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const onFinish = async (values) => {
    setLoading(true);
    const success = await login(values.email, values.password);
    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
      <h1 className="login-title">施工验收台</h1>
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#666', fontSize: 14 }}>设计图纸报价预算系统</h2>
      <Form
        name="login"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: '请输入邮箱!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="邮箱" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
    </div>
  );
};

export default Login;
