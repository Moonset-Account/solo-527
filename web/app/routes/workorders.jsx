import { useEffect, useState } from "react";
import { useNavigate, Link, useOutletContext } from "@remix-run/react";

const STATUS_MAP = {
  draft: { label: "草稿", cls: "bg-slate-100 text-slate-600" },
  pending: { label: "待排产", cls: "bg-amber-100 text-amber-700" },
  in_production: { label: "生产中", cls: "bg-blue-100 text-blue-700" },
  quality_check: { label: "质检中", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "已完成", cls: "bg-emerald-100 text-emerald-700" },
  hold: { label: "暂停", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "取消", cls: "bg-slate-300 text-slate-600" }
};
const PRIORITY_MAP = {
  low: { label: "低", cls: "bg-slate-100 text-slate-600" },
  normal: { label: "普通", cls: "bg-sky-100 text-sky-700" },
  high: { label: "高", cls: "bg-orange-100 text-orange-700" },
  urgent: { label: "紧急", cls: "bg-rose-100 text-rose-700" }
};
const MAT_MAP = {
  not_ready: { label: "未齐套", cls: "bg-rose-100 text-rose-700" },
  partial: { label: "部分齐套", cls: "bg-amber-100 text-amber-700" },
  ready: { label: "已齐套", cls: "bg-emerald-100 text-emerald-700" }
};

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const r = await fetch(url, { credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    setData(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, [url]);
  return { data, loading, reload: load };
};

const StatusBadge = ({ s }) => { const m = STATUS_MAP[s] || STATUS_MAP.draft; return <span className={`badge ${m.cls}`}>{m.label}</span>; };
const PriorityBadge = ({ p }) => { const m = PRIORITY_MAP[p] || PRIORITY_MAP.normal; return <span className={`badge ${m.cls}`}>{m.label}</span>; };

export { STATUS_MAP, PRIORITY_MAP, MAT_MAP, useFetch, StatusBadge, PriorityBadge };

export default function WorkOrdersPage() {
  const nav = useNavigate();
  const { user } = useOutletContext();
  const [q, setQ] = useState({ status: "", priority: "", keyword: "", page: 1, limit: 20 });
  const [showCreate, setShowCreate] = useState(false);
  const url = `/api/workorders?${new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([,v]) => v !== ""))).toString()}`;
  const { data, loading, reload } = useFetch(url);

  const createOrder = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    body.quantity = Number(body.quantity);
    const r = await fetch("/api/workorders", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (r.ok) { setShowCreate(false); reload(); }
    else { const d = await r.json(); alert(d.error); }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-56">
              <input className="input" placeholder="🔍 搜索工单号/产品/客户" value={q.keyword} onChange={e => setQ({...q, keyword: e.target.value, page: 1})} />
            </div>
            <select className="select w-36" value={q.status} onChange={e => setQ({...q, status: e.target.value, page: 1})}>
              <option value="">全部状态</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="select w-32" value={q.priority} onChange={e => setQ({...q, priority: e.target.value, page: 1})}>
              <option value="">全部优先级</option>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>＋ 新建工单</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>工单号</th><th>产品名称</th><th>数量</th><th>优先级</th>
                <th>状态</th><th>计划交期</th><th>责任人</th><th>物料</th><th>合格率</th><th>风险</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center py-10 text-slate-400">加载中...</td></tr>}
              {!loading && data?.list?.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-slate-400">暂无工单</td></tr>}
              {!loading && data?.list?.map(o => {
                const daysLeft = Math.ceil((new Date(o.plannedEndDate) - new Date()) / 86400000);
                const progress = Math.min(100, Math.round(((o.producedQty || 0) / o.quantity) * 100));
                return (
                  <tr key={o._id}>
                    <td className="font-mono text-brand-700 font-medium">{o.orderNo}</td>
                    <td>
                      <div className="font-medium">{o.productName}</div>
                      {o.productCode && <div className="text-xs text-slate-500">{o.productCode}</div>}
                    </td>
                    <td>
                      <div>{o.quantity.toLocaleString()}</div>
                      <div className="mt-1 w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: progress + "%" }} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{o.producedQty || 0}/{o.quantity} ({progress}%)</div>
                    </td>
                    <td><PriorityBadge p={o.priority} /></td>
                    <td><StatusBadge s={o.status} /></td>
                    <td>
                      <div>{new Date(o.plannedEndDate).toLocaleDateString("zh-CN")}</div>
                      <div className={`text-xs mt-0.5 ${daysLeft < 0 ? "text-rose-600 font-medium" : daysLeft <= 3 ? "text-amber-600" : "text-slate-500"}`}>
                        {daysLeft < 0 ? `逾期${-daysLeft}天` : `剩${daysLeft}天`}
                      </div>
                    </td>
                    <td className="text-sm">{o.ownerId?.name || "-"}</td>
                    <td>{MAT_MAP[o.materialStatus] && <span className={`badge ${MAT_MAP[o.materialStatus].cls}`}>{MAT_MAP[o.materialStatus].label}</span>}</td>
                    <td>
                      {o.qualityPassRate > 0 ? (
                        <span className={o.qualityPassRate < 90 ? "text-rose-600 font-medium" : "text-emerald-600"}>
                          {o.qualityPassRate}%
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                      {o.equipmentDown && <div className="badge bg-rose-100 text-rose-700 mt-1">⚠ 设备停机</div>}
                    </td>
                    <td className="max-w-[160px]">
                      <div className="flex flex-wrap gap-1">
                        {o.riskFlags?.length > 0 ? o.riskFlags.slice(0, 2).map(f => (
                          <span key={f} className="badge bg-rose-50 text-rose-600 border border-rose-200">{f}</span>
                        )) : <span className="text-slate-400 text-xs">正常</span>}
                        {o.riskFlags?.length > 2 && <span className="text-xs text-slate-400">+{o.riskFlags.length - 2}</span>}
                      </div>
                    </td>
                    <td>
                      <Link to={`/workorders/${o._id}`} className="text-brand-600 hover:underline text-sm">查看</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && data.total > q.limit && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">共 {data.total} 条</div>
            <div className="flex gap-1">
              <button className="btn-secondary" disabled={q.page <= 1} onClick={() => setQ({...q, page: q.page - 1})}>上一页</button>
              <span className="px-3 py-2 text-sm">{q.page} / {Math.ceil(data.total / q.limit)}</span>
              <button className="btn-secondary" disabled={q.page >= Math.ceil(data.total / q.limit)} onClick={() => setQ({...q, page: q.page + 1})}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="card-header"><h3 className="font-semibold">新建工单</h3><button className="btn-ghost" onClick={() => setShowCreate(false)}>✕</button></div>
            <form onSubmit={createOrder} className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">产品名称 *</label><input name="productName" required className="input" /></div>
                <div><label className="label">产品编号</label><input name="productCode" className="input" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">数量 *</label><input type="number" name="quantity" min="1" required defaultValue="100" className="input" /></div>
                <div><label className="label">优先级</label>
                  <select name="priority" className="select" defaultValue="normal">
                    {Object.entries(PRIORITY_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><label className="label">状态</label>
                  <select name="status" className="select" defaultValue="draft">
                    {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">计划开始日期</label><input type="date" name="plannedStartDate" className="input" defaultValue={new Date().toISOString().slice(0,10)} /></div>
                <div><label className="label">计划完成日期 *</label><input type="date" name="plannedEndDate" required className="input" defaultValue={new Date(Date.now() + 7*86400000).toISOString().slice(0,10)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">客户名称</label><input name="customer" className="input" /></div>
                <div><label className="label">设备编号</label><input name="equipmentId" className="input" placeholder="如 CNC-01" /></div>
              </div>
              <div><label className="label">备注</label><textarea name="remark" rows="2" className="input" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
