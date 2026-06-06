import { useEffect, useState } from "react";
import { useLoaderData, redirect, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, getStatusBadge, formatDate, isOverdue } from "../utils/api";
import { serverFetch } from "../utils/server-fetch";
import type { BorrowOrder, User } from "../types";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user } = await serverFetch<{ user: User }>(request, "/auth/me");

    let ordersData = { orders: [] };
    let statsData = { orders: [] };
    let overdueData = { orders: [] };
    let notifData = { unread_count: 0 };
    let financeStats: any = null;

    try {
      if (user.role !== "finance") {
        ordersData = await serverFetch(request, "/borrow-orders?limit=10");
        statsData = await serverFetch(request, "/borrow-orders?view=today");
        overdueData = await serverFetch(request, "/borrow-orders?view=overdue");
      } else {
        financeStats = await serverFetch(request, "/finance/deposits");
      }
      notifData = await serverFetch(request, "/notifications?unread_only=true&limit=1");
    } catch (e) {}

    return json({
      user,
      recentOrders: (ordersData as any).orders || [],
      todayReturn: (statsData as any).orders || [],
      overdue: (overdueData as any).orders || [],
      unreadCount: (notifData as any).unread_count || 0,
      financeStats: financeStats?.stats || null,
    });
  } catch (err) {
    return redirect("/login");
  }
}

export default function Dashboard() {
  const { user, recentOrders, todayReturn, overdue, unreadCount, financeStats } = useLoaderData<typeof loader>();

  if (user.role === "finance") {
    return (
      <AppLayout user={user} unreadCount={unreadCount}>
        <div className="page-header">
          <h1 className="page-title">财务工作台</h1>
          <Link to="/finance" className="btn btn-primary">
            查看完整对账
          </Link>
        </div>

        <div className="grid grid-4 mb-8">
          <div className="stat-card">
            <div className="stat-label">已冻结押金</div>
            <div className="stat-value" style={{ color: "#2563eb" }}>
              ¥{Number(financeStats?.total_frozen || 0).toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已扣除赔付</div>
            <div className="stat-value" style={{ color: "#dc2626" }}>
              ¥{Number(financeStats?.total_deducted || 0).toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已退还押金</div>
            <div className="stat-value" style={{ color: "#059669" }}>
              ¥{Number(financeStats?.total_refunded || 0).toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">未读通知</div>
            <div className="stat-value" style={{ color: "#7c3aed" }}>
              {unreadCount}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">财务权限说明</h2>
          <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "8px" }}>
            <ul style={{ color: "#166534", lineHeight: "1.8" }}>
              <li>✅ 可查看所有押金冻结、扣减、退还记录</li>
              <li>✅ 可导出财务对账 Excel 报表</li>
              <li>✅ 可查看系统审计日志</li>
              <li>❌ 不可查看借用单详情和备件库存</li>
            </ul>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} unreadCount={unreadCount}>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        {user.role === "engineer" && (
          <Link to="/borrow-orders/new" className="btn btn-primary">
            + 新建借用申请
          </Link>
        )}
      </div>

      <div className="grid grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">待归还（今日）</div>
          <div className="stat-value" style={{ color: "#2563eb" }}>
            {todayReturn.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">超期未还</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>
            {overdue.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">进行中单据</div>
          <div className="stat-value" style={{ color: "#059669" }}>
            {recentOrders.filter((o: BorrowOrder) => 
              ["pending", "approved", "picked", "extended"].includes(o.status)
            ).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">未读通知</div>
          <div className="stat-value" style={{ color: "#7c3aed" }}>
            {unreadCount}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">今日待归还</h2>
            <Link to="/borrow-orders?view=today" className="btn btn-outline btn-sm">
              查看全部
            </Link>
          </div>
          {todayReturn.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>
              今日无待归还备件
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>单号</th>
                  <th>备件</th>
                  <th>借用人</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {todayReturn.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/borrow-orders/${order.id}`} style={{ color: "#2563eb" }}>
                        {order.order_no}
                      </Link>
                    </td>
                    <td>{order.part_name}</td>
                    <td>{order.applicant_name}</td>
                    <td>{order.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">超期未归还</h2>
            <Link to="/borrow-orders?view=overdue" className="btn btn-outline btn-sm">
              查看全部
            </Link>
          </div>
          {overdue.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>
              无超期未还备件
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>单号</th>
                  <th>备件</th>
                  <th>借用人</th>
                  <th>应还日期</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/borrow-orders/${order.id}`} style={{ color: "#dc2626" }}>
                        {order.order_no}
                      </Link>
                    </td>
                    <td>{order.part_name}</td>
                    <td>{order.applicant_name}</td>
                    <td style={{ color: "#dc2626" }}>{formatDate(order.expected_return_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="section-title">最近单据</h2>
        <table className="table">
          <thead>
            <tr>
              <th>单号</th>
              <th>备件</th>
              <th>借用人</th>
              <th>数量</th>
              <th>状态</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order: any) => {
              const badge = getStatusBadge(order.status);
              const overdue = isOverdue(order.expected_return_date, order.status);
              return (
                <tr key={order.id}>
                  <td>
                    <Link to={`/borrow-orders/${order.id}`} style={{ color: "#2563eb" }}>
                      {order.order_no}
                    </Link>
                  </td>
                  <td>{order.part_name}</td>
                  <td>{order.applicant_name}</td>
                  <td>{order.quantity}</td>
                  <td>
                    {overdue ? (
                      <span className="badge badge-overdue">超期</span>
                    ) : (
                      <span className={`badge ${badge.class}`}>{badge.label}</span>
                    )}
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <Link to={`/borrow-orders/${order.id}`} className="btn btn-outline btn-sm">
                      详情
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
