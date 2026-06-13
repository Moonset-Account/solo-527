import { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Breadcrumb } from "antd";
import {
  DashboardOutlined,
  AlertOutlined,
  UserAddOutlined,
  ToolOutlined,
  ScheduleOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { key: "/", icon: <DashboardOutlined />, label: "总览仪表盘" },
  { key: "/alerts", icon: <AlertOutlined />, label: "告警确认" },
  { key: "/account-requests", icon: <UserAddOutlined />, label: "账号申请" },
  { key: "/inspections", icon: <ToolOutlined />, label: "设备巡检" },
  { key: "/duty", icon: <ScheduleOutlined />, label: "值班管理", adminOnly: true },
  { key: "/records", icon: <FileSearchOutlined />, label: "处理记录" },
  { key: "/reports", icon: <BarChartOutlined />, label: "时效报表", adminOnly: true },
  { key: "/audit-logs", icon: <AuditOutlined />, label: "审计日志", adminOnly: true },
];

const breadcrumbNameMap: Record<string, string> = {
  "/": "总览仪表盘",
  "/alerts": "告警确认",
  "/account-requests": "账号申请",
  "/inspections": "设备巡检",
  "/duty": "值班管理",
  "/records": "处理记录",
  "/reports": "时效报表",
  "/audit-logs": "审计日志",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loadUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  const isAdmin = user?.role === "admin";

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const breadcrumbItems = [
    { title: "首页", href: "/" },
    ...pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      const name = breadcrumbNameMap[url];
      return { title: name || url, href: url };
    }),
  ];

  const selectedKey = (() => {
    if (location.pathname === "/") return "/";
    const match = menuItems
      .filter((item) => item.key !== "/")
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key));
    return match?.key || "/";
  })();

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        theme="dark"
        style={{
          background: "#1A365D",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: collapsed ? 16 : 18,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {collapsed ? "IT" : "IT值班响应系统"}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => navigate(key)}
          style={{
            background: "transparent",
            borderRight: "none",
          }}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, cursor: "pointer", color: "#1A365D" }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb
              items={breadcrumbItems.map((item) => ({
                title: item.href ? (
                  <a onClick={() => navigate(item.href!)}>{item.title}</a>
                ) : (
                  item.title
                ),
              }))}
            />
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "#38B2AC" }}
              />
              <span style={{ color: "#1A365D", fontWeight: 500 }}>
                {user?.displayName || "用户"}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            minHeight: "calc(100vh - 64px - 48px)",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
