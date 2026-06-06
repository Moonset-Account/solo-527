import { useState, useEffect } from "react";
import { useLoaderData, Link, useSearchParams, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, getStatusBadge, formatDate, isOverdue } from "../utils/api";
import { serverFetch } from "../utils/server-fetch";
import type { BorrowOrder, User } from "../types";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user } = await serverFetch<{ user: User }>(request, "/auth/me");

    if (user.role === "finance") {
      return redirect("/finance");
    }

    const url = new URL(request.url);
    const ordersData = await serverFetch(request, `/borrow-orders?${url.searchParams}`) as any;

    return json({ user, orders: ordersData.orders || [], total: ordersData.total || 0 });
  } catch (err) {
    return redirect("/login");
  }
}

export default function BorrowOrders() {
  const { user, orders, total } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("status") || "all");
  const [view, setView] = useState(searchParams.get("view") || "all");

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
    if (key === "status") setFilter(value);
    if (key === "view") setView(value);
  };

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">借用单管理</h1>
        {user.role === "engineer" && (
          <Link to="/borrow-orders/new" className="btn btn-primary">
            + 新建申请
          </Link>
        )}
      </div>

      <div className="card mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              className={`btn ${view === "all" ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleFilterChange("view", "all")}
            >
              全部
            </button>
            <button
              className={`btn ${view === "today" ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleFilterChange("view", "today")}
            >
              今日待还
            </button>
            <button
              className={`btn ${view === "overdue" ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleFilterChange("view", "overdue")}
            >
              超期未还
            </button>
          </div>
          <div className="flex-1" />
          <select
            className="form-select"
            style={{ width: "150px" }}
            value={filter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已批准</option>
            <option value="picked">已领取</option>
            <option value="extended">已延期</option>
            <option value="returned">已归还</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>单号</th>
              <th>备件</th>
              <th>批次</th>
              <th>借用人</th>
              <th>数量</th>
              <th>客户机器</th>
              <th>预计归还</th>
              <th>押金</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
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
                  <td>{order.batch_no || "-"}</td>
                  <td>{order.applicant_name}</td>
                  <td>{order.quantity}</td>
                  <td>{order.customer_machine_no || "-"}</td>
                  <td>
                    {overdue ? (
                      <span style={{ color: "#dc2626", fontWeight: 500 }}>
                        {formatDate(order.expected_return_date)}
                      </span>
                    ) : (
                      formatDate(order.expected_return_date)
                    )}
                  </td>
                  <td>¥{Number(order.deposit_amount).toFixed(2)}</td>
                  <td>
                    {overdue ? (
                      <span className="badge badge-overdue">超期</span>
                    ) : (
                      <span className={`badge ${badge.class}`}>{badge.label}</span>
                    )}
                  </td>
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
        {orders.length === 0 && (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
            暂无数据
          </p>
        )}
      </div>
    </AppLayout>
  );
}
