import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import "antd/dist/reset.css";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => {
  return [
    { title: "青禾库存追溯台 | 生鲜仓批次追溯系统" },
    { name: "description", content: "青禾生鲜仓库批次追溯管理系统" },
    { charSet: "utf-8" },
  ];
};

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: "#52c41a",
              borderRadius: 6,
            },
          }}
        >
          <AntdApp>
            <Outlet />
            <ScrollRestoration />
            <Scripts />
            <LiveReload />
          </AntdApp>
        </ConfigProvider>
      </body>
    </html>
  );
}
