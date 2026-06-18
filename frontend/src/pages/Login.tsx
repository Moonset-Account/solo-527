import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import { LoginResponse } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { userName: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.login(values) as LoginResponse;
      setAuth(res.token, res.user);
      message.success('登录成功');
      if (res.user.role === 'Student') {
        navigate('/my/schedule');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, color: '#1677ff', fontSize: 28, fontWeight: 700 }}>艺考培训排课系统</h1>
          <p style={{ color: '#8c8c8c', marginTop: 8 }}>ArtEduScheduler</p>
        </div>
        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 24, padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 13 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>测试账号：</div>
          <div>管理员：admin / Admin123!</div>
          <div>校长：principal / Principal123!</div>
          <div>教师：teacher1 / Teacher123!</div>
          <div>学生：student1 / Student123!</div>
        </div>
      </Card>
    </div>
  );
}
