import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { userName: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
            运维工单管理系统
          </div>
        }
      >
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="userName"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>管理员: admin / Admin@123456</p>
            <p>运维: operator / Operator@123</p>
          </div>
        </Form>
      </Card>
    </div>
  );
}
