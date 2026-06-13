import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import request from '../utils/request.js';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await request.post('/auth/login', values);
      login(res.user, res.token);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1>订阅账单对账中心</h1>
          <p>请登录您的账户</p>
        </div>
        
        <Form
          name="login"
          onFinish={handleSubmit}
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '16px' }}>
          <p>测试账号：admin / 123456（管理员）</p>
          <p>finance_staff / 123456（财务专员）</p>
          <p>finance_manager / 123456（财务经理）</p>
          <p>customer1 / 123456（客户）</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
