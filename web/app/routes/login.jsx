import { useState } from "react";
import { useNavigate, useOutletContext } from "@remix-run/react";
import { api } from "~/utils/api";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useOutletContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api.post("/auth/login", { username, password });
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    try {
      await api.post("/auth/init");
      setError("初始化成功！使用 admin / admin123 登录");
    } catch (err) {
      setError(err.message || "初始化失败");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}>
      <div className="card" style={{ width: 400, padding: 32 }}>
        <h1 className="page-title" style={{ textAlign: "center", marginBottom: 24 }}>
          选题协作台
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 24 }}>
          新闻稿件多平台排期器
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleInit}>
            初始化系统数据
          </button>
        </div>

        <div className="divider"></div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          <p style={{ marginBottom: 8 }}><strong>测试账号：</strong></p>
          <p>管理员：admin / admin123</p>
          <p>主  编：chief_editor / editor123</p>
          <p>记  者：reporter1 / reporter123</p>
        </div>
      </div>
    </div>
  );
}
