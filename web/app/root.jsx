import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLocation,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { api } from "./utils/api";
import styles from "./styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.get("/auth/me");
        setUser(data.user);
      } catch (err) {
        if (location.pathname !== "/login") {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("退出失败:", err);
    }
  };

  if (loading) {
    return (
      <html lang="zh-CN">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <div className="loading">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }

  if (!user && location.pathname !== "/login") {
    return (
      <html lang="zh-CN">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {location.pathname === "/login" ? (
          <Outlet context={{ user, setUser }} />
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            <Outlet context={{ user, setUser }} />
          </Layout>
        )}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/", label: "工作台", icon: "🏠" },
    { path: "/articles", label: "稿件管理", icon: "📝" },
    { path: "/schedule", label: "排期日历", icon: "📅" },
    { path: "/materials", label: "素材库", icon: "🖼️" },
    { path: "/exceptions", label: "异常单", icon: "⚠️" },
    { path: "/stats", label: "数据统计", icon: "📊" },
    { path: "/audit", label: "变更日志", icon: "📋" },
    { path: "/dictionaries", label: "字段字典", icon: "📚" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">选题协作台</div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span style={{ marginRight: "10px" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div></div>
          <div className="topbar-user">
            <span className="text-muted">{user?.name}</span>
            <span className="badge badge-primary">{getRoleLabel(user?.role)}</span>
            <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
            <button className="btn btn-secondary btn-sm" onClick={onLogout}>
              退出
            </button>
          </div>
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}

function getRoleLabel(role) {
  const roleMap = {
    reporter: "记者",
    editor: "编辑",
    chief_editor: "主编",
    admin: "管理员",
  };
  return roleMap[role] || role;
}

export function meta() {
  return [
    { title: "选题协作台 - 新闻稿件多平台排期器" },
    { name: "description", content: "选题协作台，新闻稿件多平台排期管理系统" },
  ];
}
