import { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Typography, Space, Divider, message, Spin } from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { useAuthStore } from '../../store/useAuthStore';
import { User, ApiResponse } from '../../types';

const { Title, Text } = Typography;

interface ProfileFormValues {
  name: string;
  phone: string;
  email: string;
}

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [form] = Form.useForm<ProfileFormValues>();
  const [loading, setLoading] = useState(false);

  const initialValues: ProfileFormValues = {
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) {
      message.error('用户信息未获取到，请重新登录');
      return;
    }
    setLoading(true);
    try {
      const res: ApiResponse<User> = await request.put(`/users/${user.id}`, values);
      setUser(res.data);
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('更新个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        个人中心
      </Title>

      <div style={{ display: 'flex', gap: 24 }}>
        <Card style={{ width: 280, textAlign: 'center' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff', margin: '0 auto' }} />
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {user?.name || user?.username}
              </Title>
              <Text type="secondary">顾客账号</Text>
            </div>
            <Divider style={{ margin: 0 }} />
            <Space direction="vertical" size={8} style={{ width: '100%', textAlign: 'left' }}>
              <div>
                <Text type="secondary" style={{ display: 'block' }}>手机号</Text>
                <Text strong>{user?.phone || '-'}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block' }}>邮箱</Text>
                <Text strong>{user?.email || '-'}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block' }}>注册时间</Text>
                <Text strong>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                </Text>
              </div>
            </Space>
          </Space>
        </Card>

        <Card title="编辑信息" style={{ flex: 1 }}>
          <Spin spinning={loading}>
            <Form<ProfileFormValues>
              form={form}
              layout="vertical"
              initialValues={initialValues}
              onFinish={handleSubmit}
              style={{ maxWidth: 480 }}
            >
              <Form.Item
                label="姓名"
                name="name"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { min: 2, message: '姓名至少2个字符' },
                ]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
