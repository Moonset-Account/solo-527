import { useEffect, useState } from 'react';
import { Form, useNavigate, useActionData } from '@remix-run/react';
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { useAuth } from '~/utils/auth';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  return json({ username, password });
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (actionData) {
      handleLogin(actionData.username, actionData.password);
    }
  }, [actionData]);

  async function handleLogin(username: string, password: string) {
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 className="login-title">门店巡检整改平台</h1>
        <p className="login-subtitle">连锁门店标准化管理系统</p>
        
        <Form method="post">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="请输入用户名"
              defaultValue="supervisor1"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="请输入密码"
              defaultValue="123456"
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </Form>
        
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>演示账号：</p>
          <div className="text-sm text-muted" style={{ lineHeight: '1.8' }}>
            <div>督导：supervisor1 / 123456</div>
            <div>店长：manager_sh001 / 123456</div>
            <div>区域经理：regional_east / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
