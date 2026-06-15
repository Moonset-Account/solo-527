import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onFinish = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      message.success('登录成功');
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
    }}>
      <Card
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            牙科诊所报价协同系统
          </div>
        }
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            initialValues={{ email: 'admin@dental.com', password: 'admin123' }}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="邮箱地址" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block style={{ height: 44 }}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
          默认账号: admin@dental.com / admin123
        </div>
      </Card>
    </div>
  );
};

export default Login;
