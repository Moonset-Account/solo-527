import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            color: #1f2937;
          }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn-primary { background: #2563eb; color: white; }
          .btn-primary:hover { background: #1d4ed8; }
          .btn-success { background: #059669; color: white; }
          .btn-success:hover { background: #047857; }
          .btn-danger { background: #dc2626; color: white; }
          .btn-danger:hover { background: #b91c1c; }
          .btn-secondary { background: #6b7280; color: white; }
          .btn-secondary:hover { background: #4b5563; }
          .btn-outline { 
            background: white; 
            border: 1px solid #d1d5db; 
            color: #374151;
          }
          .btn-outline:hover { background: #f9fafb; }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 24px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          .table th, .table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .table th {
            background: #f9fafb;
            font-weight: 600;
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table tr:hover { background: #f9fafb; }
          .form-group { margin-bottom: 16px; }
          .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            font-size: 14px;
            color: #374151;
          }
          .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }
          .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
          .form-textarea { resize: vertical; min-height: 100px; }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-approved { background: #dbeafe; color: #1e40af; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          .badge-picked { background: #e0e7ff; color: #3730a3; }
          .badge-extended { background: #f3e8ff; color: #6b21a8; }
          .badge-returned { background: #d1fae5; color: #065f46; }
          .badge-damaged { background: #fed7aa; color: #9a3412; }
          .badge-lost { background: #fecaca; color: #991b1b; }
          .badge-overdue { background: #fecdd3; color: #9f1239; }
          .nav {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .nav-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 64px;
          }
          .nav-brand {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          .nav-links { display: flex; gap: 8px; }
          .nav-link {
            padding: 8px 16px;
            border-radius: 6px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
          }
          .nav-link:hover { background: #f3f4f6; color: #1f2937; }
          .nav-link.active { background: #eff6ff; color: #2563eb; }
          .nav-user { display: flex; align-items: center; gap: 12px; }
          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .page-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
          }
          .grid { display: grid; gap: 20px; }
          .grid-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-4 { grid-template-columns: repeat(4, 1fr); }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .stat-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
          .stat-value { font-size: 28px; font-weight: 700; color: #1f2937; }
          .detail-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .detail-label {
            width: 140px;
            color: #6b7280;
            font-size: 14px;
          }
          .detail-value {
            flex: 1;
            color: #1f2937;
            font-size: 14px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .tabs {
            display: flex;
            gap: 4px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }
          .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
          }
          .tab.active {
            color: #2563eb;
            border-bottom-color: #2563eb;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .photo-item {
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            background: #f3f4f6;
          }
          .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-card {
            width: 400px;
            padding: 40px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          }
          .login-title {
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 8px;
          }
          .login-subtitle {
            text-align: center;
            color: #6b7280;
            margin-bottom: 32px;
          }
          .error-text { color: #dc2626; font-size: 13px; margin-top: 4px; }
          .success-text { color: #059669; font-size: 13px; margin-top: 4px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-8 { margin-bottom: 32px; }
          .mt-4 { margin-top: 16px; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .gap-2 { gap: 8px; }
          .gap-4 { gap: 16px; }
          .w-full { width: 100%; }
          .text-right { text-align: right; }
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
