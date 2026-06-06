import { useState } from "react";
import { useLoaderData, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, formatDate } from "../utils/api";

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

    if (user.role !== "warehouse" && user.role !== "supervisor") {
      return redirect("/");
    }

    const invRes = await fetch(
      `${new URL(request.url).origin}/api/inventory?limit=100`,
      { headers: request.headers, credentials: "include" }
    );
    const invData = invRes.ok ? await invRes.json() : { inventory: [] };

    return json({ user, inventory: invData.inventory || [] });
  } catch (err) {
    return redirect("/login");
  }
}

export default function Inventory() {
  const { user, inventory } = useLoaderData<typeof loader>();
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError("");
    try {
      const res = await apiFetch(`/inventory/scan/${scanInput}`);
      setScanResult(res.inventory);
    } catch (err: any) {
      setScanError(err.message || "未找到该批次");
      setScanResult(null);
    }
  };

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">库存管理</h1>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3 className="section-title">扫码查询</h3>
          <form onSubmit={handleScan} className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="扫描或输入批次号..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              查询
            </button>
          </form>
          {scanError && <p className="error-text mt-4">{scanError}</p>}
          {scanResult && (
            <div style={{ marginTop: "16px", padding: "16px", background: "#f0fdf4", borderRadius: "8px" }}>
              <p style={{ fontWeight: 600, marginBottom: "8px" }}>
                {scanResult.part_code} - {scanResult.part_name}
              </p>
              <p>批次: {scanResult.batch_no}</p>
              <p>可用: {scanResult.available_quantity} / 总库存: {scanResult.quantity}</p>
              <p>库位: {scanResult.location || "-"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">库存列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>备件编码</th>
              <th>备件名称</th>
              <th>批次号</th>
              <th>总库存</th>
              <th>可用</th>
              <th>已锁定</th>
              <th>库位</th>
              <th>过期日期</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((inv: any) => (
              <tr key={inv.id}>
                <td>{inv.part_code}</td>
                <td>{inv.part_name}</td>
                <td style={{ fontFamily: "monospace" }}>{inv.batch_no}</td>
                <td>{inv.quantity}</td>
                <td style={{ color: "#059669", fontWeight: 500 }}>{inv.available_quantity}</td>
                <td style={{ color: "#f59e0b" }}>{inv.locked_quantity}</td>
                <td>{inv.location || "-"}</td>
                <td>{formatDate(inv.expire_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
