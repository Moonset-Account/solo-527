import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '@/api/auth';
import useUserStore from '@/store/user';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useUserStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await loginApi(values.username, values.password);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      message.success('登录成功');
      
      if (result.user.role === 'USER') {
        navigate('/user/plugins');
      } else {
        navigate('/admin/approvals');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="w-96 shadow-2xl backdrop-blur-sm bg-white/95" variant="borderless">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            插件授权计费台
          </div>
          <p className="text-gray-500 text-sm">Plugin License Billing Platform</p>
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
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-10 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-1">测试账号：</p>
          <p>admin / 123456（系统管理员）</p>
          <p>op_admin / 123456（运营管理员）</p>
          <p>fin_admin / 123456（财务管理员）</p>
          <p>zhangsan / 123456（普通用户）</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
