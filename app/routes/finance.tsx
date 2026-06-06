import { useState } from "react";
import { useLoaderData, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { getDepositStatusBadge, getStatusBadge, formatDateTime } from "../utils/api";

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

    if (user.role !== "finance" && user.role !== "supervisor") {
      return redirect("/");
    }

    const url = new URL(request.url);
    const depositsRes = await fetch(
      `${new URL(request.url).origin}/api/finance/deposits?${url.searchParams}`,
      { headers: request.headers, credentials: "include" }
    );
    const depositsData = depositsRes.ok ? await depositsRes.json() : { deposits: [], stats: {} };

    return json({ user, deposits: depositsData.deposits || [], stats: depositsData.stats || {} });
  } catch (err) {
    return redirect("/login");
  }
}

export default function Finance() {
  const { user, deposits, stats } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("deposits");

  const handleExport = () => {
    window.open("/api/finance/export", "_blank");
  };

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">财务对账</h1>
        <button className="btn btn-success" onClick={handleExport}>
          📊 导出Excel
        </button>
      </div>

      <div className="grid grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">已冻结押金</div>
          <div className="stat-value" style={{ color: "#2563eb" }}>
            ¥{Number(stats.total_frozen || 0).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已扣除赔付</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>
            ¥{Number(stats.total_deducted || 0).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已退还押金</div>
          <div className="stat-value" style={{ color: "#059669" }}>
            ¥{Number(stats.total_refunded || 0).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">损坏赔付总额</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            ¥{Number(stats.total_damage || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "deposits" ? "active" : ""}`}
            onClick={() => setActiveTab("deposits")}
          >
            押金管理
          </button>
          <button 
            className={`tab ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            交易流水
          </button>
        </div>

        {activeTab === "deposits" && (
          <table className="table">
            <thead>
              <tr>
                <th>单号</th>
                <th>借用人</th>
                <th>备件</th>
                <th>押金金额</th>
                <th>押金状态</th>
                <th>赔付金额</th>
                <th>单据状态</th>
                <th>申请时间</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d: any) => {
                const depositBadge = getDepositStatusBadge(d.deposit_status);
                const statusBadge = getStatusBadge(d.status);
                return (
                  <tr key={d.id}>
                    <td style={{ fontFamily: "monospace" }}>{d.order_no}</td>
                    <td>{d.applicant_name}</td>
                    <td>{d.part_name}</td>
                    <td>¥{Number(d.deposit_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${depositBadge.class}`}>
                        {depositBadge.label}
                      </span>
                    </td>
                    <td style={{ color: d.damage_amount > 0 ? "#dc2626" : "inherit" }}>
                      {d.damage_amount > 0 ? `¥${Number(d.damage_amount).toFixed(2)}` : "-"}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td>{formatDateTime(d.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === "transactions" && (
          <TransactionsTab user={user} />
        )}
      </div>
    </AppLayout>
  );
}

function TransactionsTab({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useState(() => {
    if (!loaded) {
      fetch("/api/finance/transactions", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setTransactions(data.transactions || []))
        .finally(() => setLoaded(true));
    }
  });

  if (!loaded) return <p>加载中...</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>时间</th>
          <th>关联单号</th>
          <th>类型</th>
          <th>金额</th>
          <th>操作人</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t: any) => {
          const typeMap: Record<string, { label: string; class: string }> = {
            freeze: { label: "冻结", class: "badge-approved" },
            unfreeze: { label: "解冻", class: "badge-returned" },
            deduct: { label: "扣除", class: "badge-damaged" },
            refund: { label: "退还", class: "badge-returned" },
          };
          const type = typeMap[t.transaction_type] || { label: t.transaction_type, class: "badge-pending" };
          return (
            <tr key={t.id}>
              <td>{formatDateTime(t.created_at)}</td>
              <td>{t.order_no}</td>
              <td>
                <span className={`badge ${type.class}`}>{type.label}</span>
              </td>
              <td>¥{Number(t.amount).toFixed(2)}</td>
              <td>{t.operator_name || "-"}</td>
              <td>{t.remark || "-"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
