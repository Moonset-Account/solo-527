import { useState } from "react";
import { useLoaderData, redirect, useNavigate, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, getStatusBadge, getDepositStatusBadge, formatDate, formatDateTime } from "../utils/api";
import { serverFetch } from "../utils/server-fetch";
import type { User } from "../types";

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { user } = await serverFetch<{ user: User }>(request, "/auth/me");

    if (user.role === "finance") {
      return redirect("/finance");
    }

    const detail = await serverFetch(request, `/borrow-orders/${params.id}`) as any;

    return json({ user, ...detail });
  } catch (err: any) {
    if (err.message?.includes("403") || err.message?.includes("404")) {
      return redirect("/borrow-orders");
    }
    return redirect("/login");
  }
}

export default function BorrowOrderDetail() {
  const { user, order, return_records, extension_records, deposit_transactions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [formError, setFormError] = useState("");

  const badge = getStatusBadge(order.status);
  const depositBadge = getDepositStatusBadge(order.deposit_status);

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setLoading(true);
    setFormError("");
    try {
      const res = await apiFetch(`/borrow-orders/${order.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
      window.location.reload();
    } catch (err: any) {
      setFormError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const canApprove = user.role === "supervisor" && order.status === "pending";
  const canReject = user.role === "supervisor" && order.status === "pending";
  const canPickup = user.role === "warehouse" && order.status === "approved";
  const canExtend = 
    (user.role === "engineer" && order.applicant_id === user.id && ["picked", "extended"].includes(order.status)) ||
    (user.role === "supervisor" && ["picked", "extended"].includes(order.status));
  const canReturn = 
    (user.role === "warehouse" || user.role === "supervisor") && 
    ["picked", "extended"].includes(order.status);

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <div>
          <Link to="/borrow-orders" style={{ color: "#6b7280", fontSize: "14px" }}>
            ← 返回列表
          </Link>
          <h1 className="page-title" style={{ marginTop: "8px" }}>
            借用单详情 - {order.order_no}
          </h1>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <button 
              className="btn btn-success" 
              onClick={() => handleAction("approve")}
              disabled={loading}
            >
              {loading ? "处理中..." : "✓ 批准"}
            </button>
          )}
          {canReject && (
            <button 
              className="btn btn-danger" 
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
            >
              ✕ 拒绝
            </button>
          )}
          {canPickup && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleAction("pickup")}
              disabled={loading}
            >
              📦 出库领取
            </button>
          )}
          {canExtend && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowExtendModal(true)}
            >
              ⏰ 申请延期
            </button>
          )}
          {canReturn && (
            <button 
              className="btn btn-success" 
              onClick={() => setShowReturnModal(true)}
            >
              ↩️ 归还验收
            </button>
          )}
        </div>
      </div>

      {formError && (
        <div className="card mb-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <p style={{ color: "#dc2626" }}>{formError}</p>
        </div>
      )}

      <div className="grid grid-3">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">基本信息</h2>
            <span className={`badge ${badge.class}`}>{badge.label}</span>
          </div>

          <div className="grid grid-2">
            <div className="detail-row">
              <div className="detail-label">申请单号</div>
              <div className="detail-value">{order.order_no}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">工单编号</div>
              <div className="detail-value">{order.work_order_no || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">借用人</div>
              <div className="detail-value">{order.applicant_name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">审批人</div>
              <div className="detail-value">{order.supervisor_name || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">客户机器编号</div>
              <div className="detail-value">{order.customer_machine_no || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">客户名称</div>
              <div className="detail-value">{order.customer_name || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">备件名称</div>
              <div className="detail-value">{order.part_name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">备件编码</div>
              <div className="detail-value">{order.part_code}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">批次号</div>
              <div className="detail-value">{order.batch_no || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">库位</div>
              <div className="detail-value">{order.location || "-"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">借用数量</div>
              <div className="detail-value">{order.quantity} 个</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">备件单价</div>
              <div className="detail-value">¥{Number(order.price).toFixed(2)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">预计归还日期</div>
              <div className="detail-value">{formatDate(order.expected_return_date)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">实际归还日期</div>
              <div className="detail-value">{formatDate(order.actual_return_date)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">申请时间</div>
              <div className="detail-value">{formatDateTime(order.created_at)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">押金状态</div>
              <div className="detail-value">
                <span className={`badge ${depositBadge.class}`}>{depositBadge.label}</span>
                {" ¥"}
                {Number(order.deposit_amount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">借用原因</div>
            <div className="detail-value">{order.borrow_reason}</div>
          </div>

          {order.rejection_reason && (
            <div className="detail-row">
              <div className="detail-label">拒绝原因</div>
              <div className="detail-value" style={{ color: "#dc2626" }}>
                {order.rejection_reason}
              </div>
            </div>
          )}

          {order.damage_amount > 0 && (
            <div className="detail-row">
              <div className="detail-label">损坏赔付金额</div>
              <div className="detail-value" style={{ color: "#dc2626", fontWeight: 600 }}>
                ¥{Number(order.damage_amount).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">备件照片</h2>
          {order.photo_url ? (
            <div className="photo-item" style={{ aspectRatio: "1", marginBottom: "16px" }}>
              <img src={order.photo_url} alt={order.part_name} />
            </div>
          ) : (
            <div 
              style={{ 
                aspectRatio: "1", 
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
            <div className="detail-label">规格参数</div>
            <div className="detail-value">{order.specification || "-"}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">押金比例</div>
            <div className="detail-value">{order.deposit_ratio * 100}%</div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            归还验收记录
          </button>
          <button 
            className={`tab ${activeTab === "extensions" ? "active" : ""}`}
            onClick={() => setActiveTab("extensions")}
          >
            延期记录
          </button>
          <button 
            className={`tab ${activeTab === "deposits" ? "active" : ""}`}
            onClick={() => setActiveTab("deposits")}
          >
            押金流水
          </button>
        </div>

        {activeTab === "info" && (
          return_records.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
              暂无归还记录
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>归还时间</th>
                  <th>完好数量</th>
                  <th>损坏数量</th>
                  <th>丢失数量</th>
                  <th>验收结果</th>
                  <th>检验员</th>
                  <th>仓库操作</th>
                </tr>
              </thead>
              <tbody>
                {return_records.map((r: any) => (
                  <tr key={r.id}>
                    <td>{formatDateTime(r.created_at)}</td>
                    <td>{r.returned_quantity}</td>
                    <td>{r.damaged_quantity || 0}</td>
                    <td>{r.lost_quantity || 0}</td>
                    <td>{r.inspection_result || "-"}</td>
                    <td>{r.inspector_name || "-"}</td>
                    <td>{r.warehouse_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === "extensions" && (
          extension_records.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
              暂无延期记录
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>原归还日期</th>
                  <th>新归还日期</th>
                  <th>延期原因</th>
                  <th>审批人</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {extension_records.map((e: any) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.created_at)}</td>
                    <td>{formatDate(e.original_return_date)}</td>
                    <td>{formatDate(e.new_return_date)}</td>
                    <td>{e.reason}</td>
                    <td>{e.approver_name || "-"}</td>
                    <td>
                      <span className={`badge ${e.approved ? "badge-returned" : "badge-pending"}`}>
                        {e.approved ? "已批准" : "待审批"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === "deposits" && (
          deposit_transactions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
              暂无押金流水
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>金额</th>
                  <th>操作人</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {deposit_transactions.map((d: any) => {
                  const typeMap: Record<string, { label: string; class: string }> = {
                    freeze: { label: "冻结", class: "badge-approved" },
                    unfreeze: { label: "解冻", class: "badge-returned" },
                    deduct: { label: "扣除", class: "badge-damaged" },
                    refund: { label: "退还", class: "badge-returned" },
                  };
                  const type = typeMap[d.transaction_type] || { label: d.transaction_type, class: "badge-pending" };
                  return (
                    <tr key={d.id}>
                      <td>{formatDateTime(d.created_at)}</td>
                      <td>
                        <span className={`badge ${type.class}`}>{type.label}</span>
                      </td>
                      <td>¥{Number(d.amount).toFixed(2)}</td>
                      <td>{d.operator_name || "-"}</td>
                      <td>{d.remark || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {showExtendModal && (
        <ExtendModal
          onClose={() => setShowExtendModal(false)}
          onSubmit={(data) => handleAction("extend", data)}
          loading={loading}
          currentDate={order.expected_return_date}
        />
      )}

      {showReturnModal && (
        <ReturnModal
          onClose={() => setShowReturnModal(false)}
          onSubmit={(data) => handleAction("return", data)}
          loading={loading}
          quantity={order.quantity}
        />
      )}

      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onSubmit={(data) => handleAction("reject", data)}
          loading={loading}
        />
      )}
    </AppLayout>
  );
}

interface ExtendModalProps {
  onClose: () => void;
  onSubmit: (data: { new_return_date: string; reason: string }) => void;
  loading: boolean;
  currentDate: string;
}

function ExtendModal({ onClose, onSubmit, loading, currentDate }: ExtendModalProps) {
  const [newReturnDate, setNewReturnDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ new_return_date: newReturnDate, reason });
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>申请延期</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">当前归还日期</label>
            <input type="text" className="form-input" value={currentDate} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">新归还日期 *</label>
            <input
              type="date"
              className="form-input"
              value={newReturnDate}
              onChange={(e) => setNewReturnDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">延期原因 *</label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请说明延期原因"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "提交中..." : "提交申请"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ReturnModalProps {
  onClose: () => void;
  onSubmit: (data: {
    returned_quantity: number;
    damaged_quantity: number;
    lost_quantity: number;
    inspection_result?: string;
  }) => void;
  loading: boolean;
  quantity: number;
}

function ReturnModal({ onClose, onSubmit, loading, quantity }: ReturnModalProps) {
  const [returned, setReturned] = useState(quantity);
  const [damaged, setDamaged] = useState(0);
  const [lost, setLost] = useState(0);
  const [inspection, setInspection] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      returned_quantity: returned,
      damaged_quantity: damaged,
      lost_quantity: lost,
      inspection_result: inspection,
    });
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>归还验收</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-3 gap-2" style={{ marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">完好数量</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max={quantity}
                value={returned}
                onChange={(e) => setReturned(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">损坏数量</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max={quantity}
                value={damaged}
                onChange={(e) => setDamaged(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">丢失数量</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max={quantity}
                value={lost}
                onChange={(e) => setLost(Number(e.target.value))}
              />
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
            合计: {returned + damaged + lost} / {quantity}
            {returned + damaged + lost !== quantity && (
              <span style={{ color: "#dc2626", marginLeft: "8px" }}>
                必须等于借用数量
              </span>
            )}
          </p>
          <div className="form-group">
            <label className="form-label">验收备注</label>
            <textarea
              className="form-textarea"
              value={inspection}
              onChange={(e) => setInspection(e.target.value)}
              placeholder="请输入验收结果或备注"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              取消
            </button>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading || returned + damaged + lost !== quantity}
            >
              {loading ? "处理中..." : "确认归还"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RejectModalProps {
  onClose: () => void;
  onSubmit: (data: { reason: string }) => void;
  loading: boolean;
}

function RejectModal({ onClose, onSubmit, loading }: RejectModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ reason });
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>拒绝申请</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">拒绝原因 *</label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入拒绝原因"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? "处理中..." : "确认拒绝"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "24px",
  width: "500px",
  maxWidth: "90%",
  maxHeight: "90vh",
  overflow: "auto",
};
