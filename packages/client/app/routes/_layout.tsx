import { useState } from "react";
import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLocation } from "@remix-run/react";
import { Layout, Menu, theme } from "antd";
import {
  DashboardOutlined,
  BarcodeOutlined,
  QrcodeOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  AlertOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { json } from "@remix-run/node";
import type { ApiSingleResponse } from "~/lib/api";

const { Header, Sider, Content } = Layout;

export const loader: LoaderFunction = async () => {
  return json({ env: process.env.NODE_ENV });
};

const menuItems = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "首页看板",
  },
  {
    key: "/scan/inbound",
    icon: <QrcodeOutlined />,
    label: "扫码入库",
  },
  {
    key: "/scan/outbound",
    icon: <QrcodeOutlined />,
    label: "扫码出库",
  },
  {
    key: "/batches",
    icon: <BarcodeOutlined />,
    label: "批次追溯",
  },
  {
    key: "/inventory",
    icon: <DatabaseOutlined />,
    label: "库存管理",
  },
  {
    key: "/locations",
    icon: <AppstoreOutlined />,
    label: "库位管理",
  },
  {
    key: "/safety-stock",
    icon: <SafetyCertificateOutlined />,
    label: "安全库存",
  },
  {
    key: "/transfers",
    icon: <SwapOutlined />,
    label: "调拨申请",
  },
  {
    key: "/receipt-diffs",
    icon: <AlertOutlined />,
    label: "签收差异",
  },
  {
    key: "/reports",
    icon: <FileTextOutlined />,
    label: "报表中心",
  },
  {
    key: "/status-history",
    icon: <HistoryOutlined />,
    label: "状态历史",
  },
];

export default function MainLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKeys = menuItems
    .filter((item) => location.pathname === item.key || location.pathname.startsWith(item.key + "/"))
    .map((item) => item.key);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ background: "#001529" }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "#fff",
            fontSize: collapsed ? 18 : 20,
            fontWeight: "bold",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24, color: "#52c41a" }}>🌱</span>
          {!collapsed && <span>青禾库存追溯台</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys.length ? selectedKeys : ["/"]}
          items={menuItems}
          onClick={({ key }) => {
            window.location.href = key;
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600 }}>生鲜仓批次追溯系统</div>
          <div style={{ color: "#666", fontSize: 14 }}>
            当前操作员：系统管理员
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
