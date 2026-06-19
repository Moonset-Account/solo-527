import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { UserRole } from '../types';

const { Title } = Typography;

function Login() {
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { userName: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.userName, values.password);
      message.success('登录成功');
      const from = (location.state as any)?.from?.pathname;
      if (user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance || 
          user.role === UserRole.ConsultantManager || user.role === UserRole.Consultant ||
          user.role === UserRole.LandlordManager)) {
        navigate(from || '/admin/dashboard', { replace: true });
      } else {
        navigate(from || '/', { replace: true });
      }
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>联合办公预约系统</Title>
          <p style={{ color: '#888' }}>联合办公房源看房预约管理平台</p>
        </div>
        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p>管理员: admin / Admin@123</p>
          <p>财务: finance / Finance@123</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
