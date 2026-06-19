import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Checkbox, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore, AuthUser } from '../store';

const { Title, Text, Paragraph } = Typography;

interface LocationState {
  from?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res = await authApi.login(values);
      setAuth(res.token, res.user as AuthUser);
      message.success(`欢迎回来，${res.user.name}`);

      const state = location.state as LocationState;
      const from = state?.from || '/dashboard';
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const demoUsers: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: '123456' },
      teacher: { username: 'teacher1', password: '123456' },
      operator: { username: 'operator1', password: '123456' },
    };
    form.setFieldsValue(demoUsers[role]);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1000, width: '100%', display: 'flex', gap: 32 }}>
        <div style={{ flex: 1, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
          <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>
            亲子训练营
            <br />
            社群打卡台
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.8 }}>
            专业的亲子教育社群运营平台，帮助运营团队高效管理营期、
            <br />
            追踪打卡进度、跟进掉队学员、分析转化效果与订阅留存。
          </Paragraph>
          <div style={{ marginTop: 24, display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            <div><SafetyOutlined style={{ marginRight: 6 }} />数据加密存储</div>
            <div><UserOutlined style={{ marginRight: 6 }} />多角色权限管理</div>
            <div><LoginOutlined style={{ marginRight: 6 }} />完整操作追溯</div>
          </div>
        </div>

        <Card
          bordered={false}
          style={{
            width: 380,
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
            账号登录
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            请输入您的账号信息
          </Text>

          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ remember: true }}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<LoginOutlined />}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ fontSize: 12, color: '#aaa', margin: '16px 0 12px' }}>
            演示账号
          </Divider>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" block onClick={() => fillDemo('admin')}>管理员</Button>
            <Button size="small" block onClick={() => fillDemo('teacher')}>老师</Button>
            <Button size="small" block onClick={() => fillDemo('operator')}>运营</Button>
          </div>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
            所有演示账号密码均为 123456
          </Text>
        </Card>
      </div>
    </div>
  );
}
