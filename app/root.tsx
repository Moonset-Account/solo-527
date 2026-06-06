import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .btn { display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
          .btn-primary { background: #1890ff; color: white; }
          .btn-primary:hover { background: #40a9ff; }
          .btn-success { background: #52c41a; color: white; }
          .btn-success:hover { background: #73d13d; }
          .btn-warning { background: #faad14; color: white; }
          .btn-warning:hover { background: #ffc53d; }
          .btn-danger { background: #ff4d4f; color: white; }
          .btn-danger:hover { background: #ff7875; }
          .btn-default { background: white; color: #333; border: 1px solid #d9d9d9; }
          .btn-default:hover { border-color: #1890ff; color: #1890ff; }
          .btn-sm { padding: 4px 12px; font-size: 12px; }
          .card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 20px; }
          .form-group { margin-bottom: 16px; }
          .form-label { display: block; margin-bottom: 6px; font-weight: 500; color: #333; }
          .form-input, .form-select, .form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; transition: border-color 0.2s; }
          .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.2); }
          .form-textarea { min-height: 100px; resize: vertical; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
          .status-pending_confirm { background: #e6f7ff; color: #1890ff; }
          .status-pending_rectify { background: #fff7e6; color: #fa8c16; }
          .status-reviewed { background: #f6ffed; color: #52c41a; }
          .status-closed { background: #f5f5f5; color: #8c8c8c; }
          .status-false_positive { background: #f9f0ff; color: #722ed1; }
          .overdue { color: #ff4d4f; }
          .header { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
          .nav { display: flex; align-items: center; justify-content: space-between; height: 60px; }
          .nav-brand { font-size: 18px; font-weight: 600; color: #1890ff; }
          .nav-menu { display: flex; gap: 24px; }
          .nav-item { color: #666; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; }
          .nav-item:hover, .nav-item.active { color: #1890ff; border-bottom-color: #1890ff; }
          .nav-user { display: flex; align-items: center; gap: 12px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
          .table th { background: #fafafa; font-weight: 600; color: #333; }
          .table tr:hover { background: #fafafa; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          .stat-value { font-size: 28px; font-weight: 700; color: #1890ff; margin-bottom: 4px; }
          .stat-label { color: #8c8c8c; font-size: 14px; }
          .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: white; border-radius: 8px; }
          .filter-item { flex: 1; min-width: 150px; }
          .detail-section { margin-bottom: 24px; }
          .detail-section h3 { margin-bottom: 12px; color: #333; }
          .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
          .photo-item { aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #f5f5f5; }
          .photo-item img { width: 100%; height: 100%; object-fit: cover; }
          .log-item { padding: 12px; border-left: 3px solid #1890ff; background: #fafafa; margin-bottom: 8px; border-radius: 0 6px 6px 0; }
          .log-meta { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
          .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .login-card { width: 100%; max-width: 400px; padding: 40px; }
          .login-title { text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 8px; }
          .login-subtitle { text-align: center; color: #8c8c8c; margin-bottom: 32px; }
          .tabs { display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px; }
          .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; color: #666; }
          .tab.active { color: #1890ff; border-bottom-color: #1890ff; }
          .offline-banner { background: #fff7e6; color: #fa8c16; padding: 10px 20px; text-align: center; font-size: 14px; }
          .loading { text-align: center; padding: 40px; color: #8c8c8c; }
          .error { color: #ff4d4f; font-size: 12px; margin-top: 4px; }
          .flex { display: flex; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
          .gap-2 { gap: 8px; }
          .gap-4 { gap: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mt-4 { margin-top: 16px; }
          .text-sm { font-size: 12px; }
          .text-muted { color: #8c8c8c; }
          .w-full { width: 100%; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          @media (max-width: 768px) {
            .grid-2 { grid-template-columns: 1fr; }
            .nav-menu { display: none; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
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
