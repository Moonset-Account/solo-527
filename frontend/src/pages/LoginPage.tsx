import { useState, useEffect } from 'react';
import { Form, Input, Button, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, token } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    if (token) {
      const from = (location.state as any)?.from || '/';
      navigate(from.startsWith('/m') ? '/m' : '/dashboard');
    }
  }, [token]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      const from = (location.state as any)?.from;
      navigate(from || (window.innerWidth < 768 ? '/m' : '/dashboard'));
    } catch (e: any) {
      message.error(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, color: '#1677ff', marginBottom: 8 }}>⚖️</div>
      </div>
        <h2 className="login-title">法务合同归档系统</h2>
        <p className="login-subtitle">Legal Contract E-Archive Management</p>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} size="large" placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 44 }}>
              <SafetyCertificateOutlined /> 登 录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16, color: '#8c8c8c', fontSize: 12 }}>
          默认账号：admin / admin123
        </div>
      </div>
    </div>
  );
}
