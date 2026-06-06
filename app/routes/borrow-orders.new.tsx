import { useState, useEffect } from "react";
import { useLoaderData, redirect, Link, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch } from "../utils/api";
import type { SparePart } from "../types";

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

    if (user.role !== "engineer") {
      return redirect("/borrow-orders");
    }

    const partsRes = await fetch(
      `${new URL(request.url).origin}/api/parts?limit=100`,
      { headers: request.headers, credentials: "include" }
    );
    const partsData = partsRes.ok ? await partsRes.json() : { parts: [] };

    return json({ user, parts: partsData.parts || [] });
  } catch (err) {
    return redirect("/login");
  }
}

export default function NewBorrowOrder() {
  const { user, parts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    part_id: "",
    quantity: 1,
    expected_return_date: "",
    work_order_no: "",
    customer_machine_no: "",
    customer_name: "",
    borrow_reason: "",
  });

  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  useEffect(() => {
    if (form.part_id) {
      const part = parts.find((p: SparePart) => p.id === form.part_id);
      setSelectedPart(part || null);
    } else {
      setSelectedPart(null);
    }
  }, [form.part_id, parts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/borrow-orders", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate("/borrow-orders");
    } catch (err: any) {
      setError(err.message || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  const depositAmount = selectedPart
    ? Number(selectedPart.price) * Number(selectedPart.deposit_ratio) * form.quantity
    : 0;

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <div>
          <Link to="/borrow-orders" style={{ color: "#6b7280", fontSize: "14px" }}>
            ← 返回列表
          </Link>
          <h1 className="page-title" style={{ marginTop: "8px" }}>
            新建借用申请
          </h1>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">选择备件 *</label>
              <select
                name="part_id"
                className="form-select"
                value={form.part_id}
                onChange={handleChange}
                required
              >
                <option value="">请选择备件</option>
                {parts.map((part: SparePart) => (
                  <option key={part.id} value={part.id}>
                    {part.part_code} - {part.part_name} (库存: {part.total_available || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-2 gap-2">
              <div className="form-group">
                <label className="form-label">借用数量 *</label>
                <input
                  type="number"
                  name="quantity"
                  className="form-input"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">预计归还日期 *</label>
                <input
                  type="date"
                  name="expected_return_date"
                  className="form-input"
                  value={form.expected_return_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-2">
              <div className="form-group">
                <label className="form-label">工单编号</label>
                <input
                  type="text"
                  name="work_order_no"
                  className="form-input"
                  placeholder="请输入工单编号"
                  value={form.work_order_no}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">客户机器编号</label>
                <input
                  type="text"
                  name="customer_machine_no"
                  className="form-input"
                  placeholder="请输入客户机器编号"
                  value={form.customer_machine_no}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">客户名称</label>
              <input
                type="text"
                name="customer_name"
                className="form-input"
                placeholder="请输入客户名称"
                value={form.customer_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">借用原因 *</label>
              <textarea
                name="borrow_reason"
                className="form-textarea"
                placeholder="请详细说明借用原因和用途"
                value={form.borrow_reason}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Link to="/borrow-orders" className="btn btn-outline">
                取消
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "提交中..." : "提交申请"}
              </button>
            </div>
          </form>
        </div>

        <div>
          {selectedPart && (
            <div className="card">
              <h3 className="section-title">备件信息</h3>
              {selectedPart.photo_url ? (
                <div className="photo-item" style={{ aspectRatio: "16/9", marginBottom: "16px" }}>
                  <img src={selectedPart.photo_url} alt={selectedPart.part_name} />
                </div>
              ) : (
                <div 
                  style={{ 
                    aspectRatio: "16/9", 
                    background: "#f3f4f6", 
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    marginBottom: "16px"
                  }}
                >
                  暂无照片
                </div>
              )}
              <div className="detail-row">
                <div className="detail-label">备件编码</div>
                <div className="detail-value">{selectedPart.part_code}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">备件名称</div>
                <div className="detail-value">{selectedPart.part_name}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">规格</div>
                <div className="detail-value">{selectedPart.specification || "-"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">单价</div>
                <div className="detail-value">¥{Number(selectedPart.price).toFixed(2)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">押金比例</div>
                <div className="detail-value">{Number(selectedPart.deposit_ratio) * 100}%</div>
              </div>
              <div className="detail-row" style={{ borderBottom: "none", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid #e5e7eb" }}>
                <div className="detail-label" style={{ fontWeight: 600 }}>预计押金</div>
                <div className="detail-value" style={{ fontWeight: 700, color: "#dc2626", fontSize: "18px" }}>
                  ¥{depositAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {!selectedPart && (
            <div className="card" style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
              请选择备件查看详情
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
