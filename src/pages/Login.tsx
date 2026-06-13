import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success("登录成功");
      navigate("/");
    } catch (err: unknown) {
      const error = err as { message?: string };
      message.error(error.message || "登录失败");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1A365D 0%, #2D4A7A 100%)",
      }}
    >
      <Card
        style={{ width: 400, borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ color: "#1A365D", fontSize: 24, marginBottom: 4 }}>
            IT值班响应系统
          </h1>
          <p style={{ color: "#8c8c8c" }}>请登录您的账号</p>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ background: "#1A365D", borderColor: "#1A365D" }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
