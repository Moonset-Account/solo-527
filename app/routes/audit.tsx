import { useLoaderData, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { formatDateTime } from "../utils/api";
import { serverFetch } from "../utils/server-fetch";
import type { User } from "../types";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user } = await serverFetch<{ user: User }>(request, "/auth/me");

    if (user.role !== "supervisor") {
      return redirect("/");
    }

    const auditData = await serverFetch(request, "/audit?limit=100") as any;

    return json({ user, logs: auditData.logs || [] });
  } catch (err) {
    return redirect("/login");
  }
}

const actionLabels: Record<string, string> = {
  login: "登录",
  logout: "登出",
  login_failed: "登录失败",
  create_order: "创建借用单",
  approve_order: "批准借用单",
  reject_order: "拒绝借用单",
  pickup_order: "领取出库",
  extend_order: "申请延期",
  return_order: "归还验收",
  create_part: "创建备件",
  stock_in: "入库",
  export_finance: "导出对账",
};

export default function AuditLogs() {
  const { user, logs } = useLoaderData<typeof loader>();

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">审计日志</h1>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>操作</th>
              <th>资源类型</th>
              <th>IP地址</th>
              <th>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td style={{ fontSize: "12px" }}>{formatDateTime(log.created_at)}</td>
                <td>{log.real_name || log.username || "系统"}</td>
                <td>
                  <span className="badge badge-pending">
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>
                <td>{log.resource_type}</td>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                  {log.ip_address || "-"}
                </td>
                <td style={{ fontSize: "11px", color: "#6b7280", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {log.user_agent || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
