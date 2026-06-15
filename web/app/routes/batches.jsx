import { useEffect, useState } from "react";
import { Link, useOutletContext } from "@remix-run/react";

export default function BatchesPage() {
  const { user } = useOutletContext();
  const [q, setQ] = useState({ keyword: "", workOrderId: "", page: 1, limit: 50 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q.keyword) p.set("keyword", q.keyword);
    if (q.workOrderId) p.set("workOrderId", q.workOrderId);
    const r = await fetch(`/api/batches?${p.toString()}`, { credentials: "include" });
    if (r.ok) setData(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, [q]);
  useEffect(() => {
    fetch("/api/workorders?limit=200", { credentials: "include" }).then(r => r.json()).then(d => setOrders(d.list || []));
  }, []);

  const del = async (id) => {
    if (!confirm("确定删除该批次？此操作不可恢复")) return;
    const r = await fetch(`/api/batches/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) load();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="总批次数" value={data?.total || 0} icon="🔢" cls="bg-brand-100 text-brand-700" />
        <StatCard label="生产中" value={data?.list?.filter(b => b.status === "producing").length || 0} icon="🔨" cls="bg-blue-100 text-blue-700" />
        <StatCard label="已完成" value={data?.list?.filter(b => b.status === "completed").length || 0} icon="✅" cls="bg-emerald-100 text-emerald-700" />
        <StatCard label="责任人维护" value={<Link to="/responsibles" className="text-brand-600 hover:underline text-sm">→ 前往维护</Link>} icon="👤" cls="bg-slate-100 text-slate-700" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3 flex-wrap">
            <input className="input w-56" placeholder="🔍 批次号/产品名称" value={q.keyword} onChange={e => setQ({...q, keyword: e.target.value})} />
            <select className="select w-64" value={q.workOrderId} onChange={e => setQ({...q, workOrderId: e.target.value})}>
              <option value="">全部工单</option>
              {orders.map(o => <option key={o._id} value={o._id}>{o.orderNo} - {o.productName}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => setShow(true)}>＋ 新建追溯批次</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>批次号</th><th>关联工单</th><th>产品</th><th>数量</th>
                <th>产线</th><th>责任人</th><th>协助</th><th>状态</th><th>生产日期</th><th>追溯备注</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center py-10 text-slate-400">加载中...</td></tr>}
              {!loading && data?.list?.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-slate-400">暂无批次记录</td></tr>}
              {!loading && data?.list?.map(b => (
                <tr key={b._id}>
                  <td className="font-mono font-semibold text-brand-700">{b.batchNo}</td>
                  <td><Link to={`/workorders/${b.workOrderId?._id || b.workOrderId}`} className="text-brand-600 hover:underline font-mono text-sm">{b.workOrderId?.orderNo || "-"}</Link></td>
                  <td>{b.productName}</td>
                  <td>{b.quantity.toLocaleString()}</td>
                  <td>{b.productionLine || "-"}</td>
                  <td className="text-sm">{b.responsibleId?.name || <span className="text-rose-500">未分配</span>}</td>
                  <td className="text-sm text-slate-600">{b.assistantIds?.length > 0 ? b.assistantIds.map(a => a.name).join("、") : "-"}</td>
                  <td>
                    <span className={`badge ${{ pending: "bg-amber-100 text-amber-700", producing: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", scrapped: "bg-rose-100 text-rose-700" }[b.status]}`}>
                      {{ pending: "待生产", producing: "生产中", completed: "已完成", scrapped: "报废" }[b.status]}
                    </span>
                  </td>
                  <td>{new Date(b.produceDate).toLocaleDateString("zh-CN")}</td>
                  <td className="text-sm text-slate-600 max-w-[200px] truncate">{b.traceRemark || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <BatchEditModal batch={b} orders={orders} users={users} setUsers={setUsers} onDone={load} />
                      {user.role === "admin" && <button onClick={() => del(b._id)} className="text-rose-500 hover:underline text-sm">删除</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && <BatchCreateModal orders={orders} users={users} setUsers={setUsers} onClose={() => setShow(false)} onDone={() => { setShow(false); load(); }} />}
    </div>
  );
}

const StatCard = ({ label, value, icon, cls }) => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${cls}`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-bold text-slate-800 mt-0.5">{value}</div>
      </div>
    </div>
  </div>
);

function BatchCreateModal({ orders, users, setUsers, onClose, onDone }) {
  const [form, setForm] = useState({ workOrderId: "", quantity: 0, productionLine: "", responsibleId: "", traceRemark: "", rawMaterialLots: [] });
  useEffect(() => { if (users.length === 0) fetch("/api/auth/me", { credentials: "include" }); }, []);
  const save = async () => {
    if (!form.workOrderId) return alert("请选择关联工单");
    const r = await fetch("/api/batches", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) onDone(); else { const d = await r.json(); alert(d.error); }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="card-header"><h3 className="font-semibold">新建追溯批次</h3><button className="btn-ghost" onClick={onClose}>✕</button></div>
        <div className="card-body space-y-4">
          <div><label className="label">关联工单 *</label>
            <select className="select" value={form.workOrderId} onChange={e => { const o = orders.find(x => x._id === e.target.value); setForm({...form, workOrderId: e.target.value, quantity: o?.quantity || 0, productionLine: o?.equipmentId || "" }); }}>
              <option value="">-- 请选择 --</option>
              {orders.map(o => <option key={o._id} value={o._id}>{o.orderNo} - {o.productName} ({o.quantity}件)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">批次数量</label><input type="number" className="input" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
            <div><label className="label">产线/设备</label><input className="input" value={form.productionLine} onChange={e => setForm({...form, productionLine: e.target.value})} /></div>
          </div>
          <div><label className="label">追溯说明 / 备注</label><textarea rows="3" className="input" value={form.traceRemark} onChange={e => setForm({...form, traceRemark: e.target.value})} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button className="btn-secondary" onClick={onClose}>取消</button>
            <button className="btn-primary" onClick={save}>创建批次</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchEditModal({ batch, orders, users, setUsers, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm({ status: batch.status, productionLine: batch.productionLine, quantity: batch.quantity, traceRemark: batch.traceRemark }); }, [open]);
  const save = async () => {
    const r = await fetch(`/api/batches/${batch._id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setOpen(false); onDone(); }
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-brand-600 hover:underline text-sm">编辑</button>
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="card-header"><h3 className="font-semibold">编辑批次 {batch.batchNo}</h3><button className="btn-ghost" onClick={() => setOpen(false)}>✕</button></div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">状态</label>
                  <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="pending">待生产</option><option value="producing">生产中</option><option value="completed">已完成</option><option value="scrapped">报废</option>
                  </select>
                </div>
                <div><label className="label">产线/设备</label><input className="input" value={form.productionLine || ""} onChange={e => setForm({...form, productionLine: e.target.value})} /></div>
              </div>
              <div><label className="label">数量</label><input type="number" className="input" value={form.quantity || 0} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
              <div><label className="label">追溯备注</label><textarea rows="3" className="input" value={form.traceRemark || ""} onChange={e => setForm({...form, traceRemark: e.target.value})} /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button className="btn-secondary" onClick={() => setOpen(false)}>取消</button>
                <button className="btn-primary" onClick={save}>保存（关键字段变更自动留痕）</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
