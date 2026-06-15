import { json, type LinksFunction, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN.js";
import "antd/dist/reset.css";

export const links: LinksFunction = () => [];

export const meta: MetaFunction = () => {
  return [
    { title: "青禾库存追溯台 | 生鲜仓批次追溯系统" },
    { name: "description", content: "青禾生鲜仓库批次追溯管理系统" },
    { charSet: "utf-8" },
  ];
};

type EnvVars = {
  API_BASE_URL: string;
};

export const loader: LoaderFunction = async () => {
  const defaultApiBase = `http://127.0.0.1:${process.env.PORT ? Number(process.env.PORT) + 1 : 3001}/api`;
  const env: EnvVars = {
    API_BASE_URL: process.env.API_BASE_URL || defaultApiBase,
  };
  return json({ env });
};

declare global {
  interface Window {
    ENV: EnvVars;
  }
}

export default function App() {
  const { env } = useLoaderData<{ env: EnvVars }>();
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
            <script
              dangerouslySetInnerHTML={{
                __html: `window.ENV = ${JSON.stringify(env)};`,
              }}
            />
            <LiveReload />
          </AntdApp>
        </ConfigProvider>
      </body>
    </html>
  );
}
