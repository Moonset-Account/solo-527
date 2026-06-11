import React from 'react';
import { Form, Input, Button, Card, Typography, message, Tag, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const result = await authApi.login(values);
      setAuth(result.token, result.user);
      message.success('登录成功');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    form.submit();
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            青禾课程运营台
          </Title>
          <p style={{ color: '#999', marginTop: 8 }}>QingHe Course Platform</p>
        </div>

        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain style={{ margin: '12px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            快速登录（测试账号）
          </Text>
        </Divider>

        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Button
            block
            icon={<CrownOutlined />}
            onClick={() => quickLogin('admin', 'admin123')}
            style={{ borderColor: '#faad14', color: '#faad14' }}
          >
            <Space>
              <Tag color="gold">管理员</Tag>
              <span>admin / admin123</span>
            </Space>
          </Button>
          <Button
            block
            icon={<TeamOutlined />}
            onClick={() => quickLogin('operator', 'operator123')}
            style={{ borderColor: '#1677ff', color: '#1677ff' }}
          >
            <Space>
              <Tag color="blue">运营专员</Tag>
              <span>operator / operator123</span>
            </Space>
          </Button>
          <Button
            block
            icon={<UserOutlined />}
            onClick={() => quickLogin('student', 'student123')}
          >
            <Space>
              <Tag color="green">学员</Tag>
              <span>student / student123</span>
            </Space>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
