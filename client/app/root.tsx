import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            color: #303133;
          }
          .layout {
            display: flex;
            min-height: 100vh;
          }
          .sidebar {
            width: 240px;
            background: #001529;
            color: white;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
          }
          .sidebar-logo {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            border-bottom: 1px solid #1f3a5f;
            background: #002140;
          }
          .sidebar-menu {
            list-style: none;
            padding: 12px 0;
          }
          .sidebar-menu li {
            padding: 12px 24px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .sidebar-menu li:hover, .sidebar-menu li.active {
            background: #1890ff;
          }
          .sidebar-menu a {
            color: white;
            text-decoration: none;
            display: block;
            width: 100%;
          }
          .main-content {
            flex: 1;
            margin-left: 240px;
            display: flex;
            flex-direction: column;
          }
          .header {
            height: 60px;
            background: white;
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            box-shadow: 0 1px 4px rgba(0,21,41,0.08);
          }
          .header-right {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header-user {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }
          .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #1890ff;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 500;
          }
          .content {
            flex: 1;
            padding: 24px;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            margin-bottom: 20px;
          }
          .page-title {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 20px;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          }
          .stat-card-title {
            color: #909399;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .stat-card-value {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
          }
          .stat-card-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 12px;
          }
          .btn {
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            border: none;
            font-size: 14px;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          .btn-primary {
            background: #1890ff;
            color: white;
          }
          .btn-primary:hover {
            background: #40a9ff;
          }
          .btn-success {
            background: #52c41a;
            color: white;
          }
          .btn-warning {
            background: #faad14;
            color: white;
          }
          .btn-danger {
            background: #ff4d4f;
            color: white;
          }
          .btn-default {
            background: white;
            color: #303133;
            border: 1px solid #dcdfe6;
          }
          .btn-default:hover {
            color: #1890ff;
            border-color: #1890ff;
          }
          .btn-sm {
            padding: 4px 12px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #ebeef5;
          }
          th {
            background: #fafafa;
            font-weight: 500;
            color: #606266;
          }
          tr:hover {
            background: #f5f7fa;
          }
          .tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
          .tag-success {
            background: #f0f9eb;
            color: #67c23a;
          }
          .tag-warning {
            background: #fdf6ec;
            color: #e6a23c;
          }
          .tag-danger {
            background: #fef0f0;
            color: #f56c6c;
          }
          .tag-info {
            background: #ecf5ff;
            color: #409eff;
          }
          .tag-default {
            background: #f4f4f5;
            color: #909399;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-label {
            display: block;
            margin-bottom: 6px;
            color: #606266;
            font-size: 14px;
          }
          .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
          }
          .form-input:focus, .form-select:focus, .form-textarea:focus {
            border-color: #1890ff;
          }
          .form-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 400px;
          }
          .login-title {
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 32px;
            color: #303133;
          }
          .login-error {
            background: #fef0f0;
            color: #f56c6c;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .btn-block {
            width: 100%;
            justify-content: center;
            padding: 12px;
            font-size: 16px;
          }
          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .mb-20 {
            margin-bottom: 20px;
          }
          .ml-8 {
            margin-left: 8px;
          }
          .text-right {
            text-align: right;
          }
          .dropdown {
            position: relative;
          }
          .dropdown-menu {
            position: absolute;
            right: 0;
            top: 100%;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            min-width: 150px;
            z-index: 1000;
          }
          .dropdown-menu div {
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
          }
          .dropdown-menu div:hover {
            background: #f5f7fa;
          }
          .badge {
            position: relative;
          }
          .badge-dot {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 8px;
            height: 8px;
            background: #f56c6c;
            border-radius: 50%;
          }
          .search-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          }
          .search-bar .form-group {
            margin-bottom: 0;
            min-width: 150px;
          }
          .pagination {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
          }
          .pagination button {
            padding: 6px 12px;
            border: 1px solid #dcdfe6;
            background: white;
            border-radius: 4px;
            cursor: pointer;
          }
          .pagination button.active {
            background: #1890ff;
            color: white;
            border-color: #1890ff;
          }
          .pagination button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          .modal-mask {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal {
            background: white;
            border-radius: 8px;
            min-width: 500px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
          }
          .modal-header {
            padding: 16px 24px;
            border-bottom: 1px solid #ebeef5;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-title {
            font-size: 16px;
            font-weight: 500;
          }
          .modal-close {
            cursor: pointer;
            font-size: 20px;
            color: #909399;
          }
          .modal-body {
            padding: 24px;
          }
          .modal-footer {
            padding: 12px 24px;
            border-top: 1px solid #ebeef5;
            text-align: right;
          }
          .detail-item {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px dashed #ebeef5;
          }
          .detail-label {
            width: 120px;
            color: #909399;
          }
          .detail-value {
            flex: 1;
          }
        `}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
