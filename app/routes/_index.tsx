import { useEffect, useState } from "react";
import { useLoaderData, redirect, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, getStatusBadge, formatDate, isOverdue } from "../utils/api";
import type { BorrowOrder, User } from "../types";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userRes = await fetch(
      `${new URL(request.url).origin}/api/auth/me`,
      { headers: request.headers, credentials: "include" }
    );

    if (!userRes.ok) {
      return redirect("/login");
    }

    const { user } = await userRes.json();

    const ordersRes = await fetch(
      `${new URL(request.url).origin}/api/borrow-orders?limit=10`,
      { headers: request.headers, credentials: "include" }
    );
    const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };

    const statsRes = await fetch(
      `${new URL(request.url).origin}/api/borrow-orders?view=today`,
      { headers: request.headers, credentials: "include" }
    );
    const statsData = statsRes.ok ? await statsRes.json() : { orders: [] };

    const overdueRes = await fetch(
      `${new URL(request.url).origin}/api/borrow-orders?view=overdue`,
      { headers: request.headers, credentials: "include" }
    );
    const overdueData = overdueRes.ok ? await overdueRes.json() : { orders: [] };

    const notifRes = await fetch(
      `${new URL(request.url).origin}/api/notifications?unread_only=true&limit=1`,
      { headers: request.headers, credentials: "include" }
    );
    const notifData = notifRes.ok ? await notifRes.json() : { unread_count: 0 };

    return json({
      user,
      recentOrders: ordersData.orders || [],
      todayReturn: statsData.orders || [],
      overdue: overdueData.orders || [],
      unreadCount: notifData.unread_count || 0,
    });
  } catch (err) {
    return redirect("/login");
  }
}

export default function Dashboard() {
  const { user, recentOrders, todayReturn, overdue, unreadCount } = useLoaderData<typeof loader>();

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
