import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "@remix-run/react";
import { STATUS_MAP, PRIORITY_MAP, MAT_MAP, StatusBadge, PriorityBadge } from "./workorders.jsx";

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const r = await fetch(`/api/workorders/${id}`, { credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    if (!r.ok) { nav("/workorders"); return; }
    setData(await r.json());
  };
  useEffect(() => { load(); }, [id]);

  if (!data) return <div className="text-center py-20 text-slate-400">加载中...</div>;
  const { order, batches, materials, inspections, schedules } = data;

  const saveOrder = async (patch) => {
    setSaving(true); setErr("");
    const r = await fetch(`/api/workorders/${id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const d = await r.json();
    if (r.ok) { await load(); setSaving(false); }
    else { setErr(d.error); setSaving(false); }
  };

  const progress = Math.min(100, Math.round(((order.producedQty || 0) / order.quantity) * 100));
  const daysLeft = Math.ceil((new Date(order.plannedEndDate) - new Date()) / 86400000);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/workorders" className="btn-ghost -ml-2">← 返回列表</Link>
        {err && <div className="text-rose-600 text-sm">{err}</div>}
        {saving && <div className="text-brand-600 text-sm">保存中...</div>}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-2xl font-bold font-mono text-slate-900">{order.orderNo}</span>
                <StatusBadge s={order.status} />
                <PriorityBadge p={order.priority} />
                {order.riskFlags?.length > 0 && order.riskFlags.map(f => (
                  <span key={f} className="badge bg-rose-50 text-rose-600 border border-rose-200">{f}</span>
                ))}
              </div>
              <h2 className="text-xl font-semibold mb-1">{order.productName}</h2>
              {order.productCode && <div className="text-slate-500 text-sm mb-3">产品编号：{order.productCode}</div>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Info label="订单数量" value={`${order.quantity.toLocaleString()} 件`} />
                <Info label="已生产" value={`${order.producedQty || 0} 件 (${progress}%)`} />
                <Info label="累计工时" value={`${order.workHours || 0} 小时`} />
                <Info label="合格率" value={order.qualityPassRate > 0 ? `${order.qualityPassRate}%` : "-"} />
                <Info label="计划开始" value={order.plannedStartDate ? new Date(order.plannedStartDate).toLocaleDateString("zh-CN") : "-"} />
                <Info label="计划交期" value={new Date(order.plannedEndDate).toLocaleDateString("zh-CN")} valueCls={daysLeft < 0 ? "text-rose-600 font-medium" : daysLeft <= 3 ? "text-amber-600" : ""} />
                <Info label="实际开始" value={order.actualStartDate ? new Date(order.actualStartDate).toLocaleDateString("zh-CN") : "-"} />
                <Info label="实际完成" value={order.actualEndDate ? new Date(order.actualEndDate).toLocaleDateString("zh-CN") : "-"} />
                <Info label="客户" value={order.customer || "-"} />
                <Info label="责任人" value={order.ownerId?.name || "-"} />
                <Info label="使用设备" value={order.equipmentId || "-"} valueCls={order.equipmentDown ? "text-rose-600" : ""} />
                <Info label="物料状态" value={MAT_MAP[order.materialStatus]?.label || "-"} valueCls={order.materialStatus !== "ready" ? "text-amber-600" : "text-emerald-600"} />
              </div>
            </div>
            <div className="w-full md:w-72 space-y-3">
              <div>
                <label className="label">状态变更</label>
                <select className="select" value={order.status} onChange={e => saveOrder({ status: e.target.value })}>
                  {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">优先级</label>
                <select className="select" value={order.priority} onChange={e => saveOrder({ priority: e.target.value })}>
                  {Object.entries(PRIORITY_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">设备编号</label>
                <input className="input" defaultValue={order.equipmentId || ""} onBlur={e => saveOrder({ equipmentId: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                <input type="checkbox" checked={!!order.equipmentDown} onChange={e => saveOrder({ equipmentDown: e.target.checked, remark: prompt("请输入停机原因/备注（可选）：") || order.remark })} className="w-4 h-4 accent-rose-600" />
                <span className={`text-sm font-medium ${order.equipmentDown ? "text-rose-600" : "text-slate-600"}`}>⚠ 设备停机标记</span>
              </label>
            </div>
          </div>

          {order.remark && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs font-medium text-amber-700 mb-1">📝 备注说明</div>
              <div className="text-sm text-amber-900 whitespace-pre-wrap">{order.remark}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-slate-200">
          {[
            { k: "info", label: "📊 基础信息与备注" },
            { k: "schedule", label: "📅 生产排期" },
            { k: "material", label: "📦 物料齐套" },
            { k: "inspection", label: "🔬 质检结果" },
            { k: "batch", label: "🔍 追溯批次" }
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.k ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "info" && <InfoTab order={order} saveOrder={saveOrder} />}
          {tab === "schedule" && <ScheduleTab schedules={schedules} order={order} reload={load} user={user} />}
          {tab === "material" && <MaterialTab materials={materials} order={order} reload={load} user={user} />}
          {tab === "inspection" && <InspectionTab inspections={inspections} order={order} reload={load} user={user} />}
          {tab === "batch" && <BatchTab batches={batches} order={order} reload={load} user={user} />}
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value, valueCls = "" }) => (
  <div>
    <div className="text-slate-500 text-xs mb-0.5">{label}</div>
    <div className={`font-medium ${valueCls}`}>{value}</div>
  </div>
);

const InfoTab = ({ order, saveOrder }) => (
  <div className="space-y-4 max-w-3xl">
    <div className="grid grid-cols-2 gap-4">
      <div><label className="label">计划开始日期</label>
        <input type="date" className="input" defaultValue={order.plannedStartDate ? new Date(order.plannedStartDate).toISOString().slice(0,10) : ""}
          onBlur={e => saveOrder({ plannedStartDate: e.target.value || null })} />
      </div>
      <div><label className="label">计划完成日期（关键字段，变更自动留痕）</label>
        <input type="date" className="input" defaultValue={new Date(order.plannedEndDate).toISOString().slice(0,10)}
          onBlur={e => saveOrder({ plannedEndDate: e.target.value })} />
      </div>
      <div><label className="label">客户名称</label>
        <input className="input" defaultValue={order.customer || ""} onBlur={e => saveOrder({ customer: e.target.value })} />
      </div>
      <div><label className="label">订单数量（关键字段）</label>
        <input type="number" className="input" defaultValue={order.quantity} onBlur={e => saveOrder({ quantity: Number(e.target.value) })} />
      </div>
    </div>
    <div>
      <label className="label">备注（与关键字段同处，集中管理）</label>
      <textarea rows="4" className="input" defaultValue={order.remark || ""}
        onBlur={e => saveOrder({ remark: e.target.value })} placeholder="记录特殊说明、异常情况、变更原因等..." />
      <div className="text-xs text-slate-500 mt-1">💡 关键字段（状态/交期/优先级/数量/设备/责任人）的任何修改都会自动写入审计日志，管理员可在"操作日志"中查看完整变更记录。</div>
    </div>
  </div>
);

const ScheduleTab = ({ schedules, order, reload, user }) => {
  const [form, setForm] = useState({ plannedDate: "", shift: "full", productionLine: order.equipmentId || "", plannedHours: 8, notes: "" });
  const add = async () => {
    if (!form.plannedDate) return alert("请选择日期");
    const r = await fetch("/api/schedules", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, workOrderId: order._id })
    });
    if (r.ok) { setForm({ plannedDate: "", shift: "full", productionLine: order.equipmentId || "", plannedHours: 8, notes: "" }); reload(); }
  };
  const del = async (id) => { if (!confirm("删除该排期？")) return; const r = await fetch(`/api/schedules/${id}`, { method: "DELETE", credentials: "include" }); if (r.ok) reload(); };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input type="date" className="input" value={form.plannedDate} onChange={e => setForm({...form, plannedDate: e.target.value})} />
        <select className="select" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
          <option value="full">全天</option><option value="morning">白班</option><option value="afternoon">中班</option><option value="night">夜班</option>
        </select>
        <input className="input" placeholder="产线/设备" value={form.productionLine} onChange={e => setForm({...form, productionLine: e.target.value})} />
        <input type="number" className="input" placeholder="计划工时" value={form.plannedHours} onChange={e => setForm({...form, plannedHours: Number(e.target.value)})} />
        <button className="btn-primary" onClick={add}>＋ 添加排期</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>日期</th><th>班次</th><th>产线/设备</th><th>工时</th><th>备注</th><th></th></tr></thead>
          <tbody>
            {schedules.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无排期记录</td></tr>}
            {schedules.map(s => (
              <tr key={s._id}>
                <td>{new Date(s.plannedDate).toLocaleDateString("zh-CN")}</td>
                <td>{{ full: "全天", morning: "白班", afternoon: "中班", night: "夜班" }[s.shift]}</td>
                <td>{s.productionLine || "-"}</td>
                <td>{s.plannedHours}h</td>
                <td>{s.notes || "-"}</td>
                <td>{user.role === "admin" && <button onClick={() => del(s._id)} className="text-rose-500 hover:underline text-sm">删除</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MaterialTab = ({ materials, order, reload, user }) => {
  const [items, setItems] = useState(materials?.items || []);
  const [remark, setRemark] = useState(materials?.remark || "");
  const addRow = () => setItems([...items, { code: "", name: "", requiredQty: 0, preparedQty: 0, unit: "PCS", location: "", status: "missing", remark: "" }]);
  const upd = (i, k, v) => { const n = [...items]; n[i][k] = (k === "requiredQty" || k === "preparedQty") ? Number(v) : v; setItems(n); };
  const del = (i) => setItems(items.filter((_, idx) => idx !== i));
  const save = async () => {
    const r = await fetch("/api/materials", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: order._id, items, remark })
    });
    if (r.ok) { alert("已保存物料齐套信息，工单风险标识已同步更新"); reload(); }
    else { const d = await r.json(); alert(d.error); }
  };
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr>
            <th>物料代码</th><th>名称</th><th>需求</th><th>已备</th><th>单位</th>
            <th>库位</th><th>状态</th><th>备注</th><th></th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-400">暂无物料，点击下方按钮添加</td></tr>}
            {items.map((it, i) => (
              <tr key={i}>
                <td><input className="input !py-1" value={it.code} onChange={e => upd(i, "code", e.target.value)} /></td>
                <td><input className="input !py-1" value={it.name} onChange={e => upd(i, "name", e.target.value)} /></td>
                <td><input type="number" className="input !py-1 !w-24" value={it.requiredQty} onChange={e => upd(i, "requiredQty", e.target.value)} /></td>
                <td><input type="number" className="input !py-1 !w-24" value={it.preparedQty} onChange={e => upd(i, "preparedQty", e.target.value)} /></td>
                <td><input className="input !py-1 !w-20" value={it.unit} onChange={e => upd(i, "unit", e.target.value)} /></td>
                <td><input className="input !py-1 !w-28" value={it.location} onChange={e => upd(i, "location", e.target.value)} /></td>
                <td>{it.preparedQty >= it.requiredQty && it.requiredQty > 0 ? <span className="badge bg-emerald-100 text-emerald-700">已备齐</span> : it.preparedQty > 0 ? <span className="badge bg-amber-100 text-amber-700">部分</span> : <span className="badge bg-rose-100 text-rose-700">缺料</span>}</td>
                <td><input className="input !py-1" value={it.remark || ""} onChange={e => upd(i, "remark", e.target.value)} /></td>
                <td><button onClick={() => del(i)} className="text-rose-500 hover:underline text-sm">删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <label className="label">齐套备注</label>
        <textarea rows="2" className="input" value={remark} onChange={e => setRemark(e.target.value)} placeholder="物料整体情况说明..." />
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={addRow}>＋ 新增物料行</button>
        <button className="btn-primary" onClick={save}>💾 保存齐套信息</button>
      </div>
    </div>
  );
};

const InspectionTab = ({ inspections, order, reload }) => {
  const [form, setForm] = useState({ sampleSize: 0, passQty: 0, failQty: 0, result: "pending", conclusion: "", defects: [] });
  const [showAdd, setShowAdd] = useState(false);
  const save = async () => {
    const r = await fetch("/api/inspections", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, workOrderId: order._id })
    });
    if (r.ok) { setShowAdd(false); reload(); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">共 {inspections.length} 次质检，当前合格率：<span className={`font-semibold ${order.qualityPassRate < 90 ? "text-rose-600" : "text-emerald-600"}`}>{order.qualityPassRate}%</span></div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>＋ 新增质检</button>
      </div>
      <div className="space-y-3">
        {inspections.length === 0 && <div className="text-center py-10 text-slate-400">暂无质检记录</div>}
        {inspections.map(ins => (
          <div key={ins._id} className="border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <span className="badge bg-slate-100 text-slate-600">{new Date(ins.inspectDate).toLocaleString("zh-CN")}</span>
                <span className={`badge ${ins.result === "pass" ? "bg-emerald-100 text-emerald-700" : ins.result === "fail" ? "bg-rose-100 text-rose-700" : ins.result === "rework" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {{ pass: "合格", fail: "不合格", rework: "需返工", pending: "待判定" }[ins.result]}
                </span>
                <span className="text-xs text-slate-500">检验员：{ins.inspectorId?.name || "-"}</span>
              </div>
              <div className="text-sm font-medium">
                <span className="text-slate-600">抽检 {ins.sampleSize} 件</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-emerald-600">合格 {ins.passQty}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-rose-600">不合格 {ins.failQty}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-brand-700">{ins.sampleSize > 0 ? Math.round(ins.passQty / ins.sampleSize * 10000) / 100 : 0}%</span>
              </div>
            </div>
            {ins.defectItems?.length > 0 && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <div className="text-xs font-medium text-rose-700 mb-1">不良项明细</div>
                {ins.defectItems.map((d, i) => (
                  <div key={i} className="text-xs text-rose-800">
                    · [{d.severity === "critical" ? "严重" : d.severity === "major" ? "主要" : "次要"}] {d.category} - {d.description} × {d.quantity}
                  </div>
                ))}
              </div>
            )}
            {ins.conclusion && <div className="mt-2 text-sm text-slate-700">结论：{ins.conclusion}</div>}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-xl">
            <div className="card-header"><h3 className="font-semibold">录入质检结果</h3><button className="btn-ghost" onClick={() => setShowAdd(false)}>✕</button></div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">抽样数</label><input type="number" className="input" value={form.sampleSize} onChange={e => setForm({...form, sampleSize: Number(e.target.value)})} /></div>
                <div><label className="label">合格数</label><input type="number" className="input" value={form.passQty} onChange={e => setForm({...form, passQty: Number(e.target.value)})} /></div>
                <div><label className="label">不合格数</label><input type="number" className="input" value={form.failQty} onChange={e => setForm({...form, failQty: Number(e.target.value)})} /></div>
              </div>
              <div>
                <label className="label">判定结果</label>
                <select className="select" value={form.result} onChange={e => setForm({...form, result: e.target.value})}>
                  <option value="pending">待判定</option><option value="pass">合格</option><option value="rework">需返工</option><option value="fail">不合格</option>
                </select>
              </div>
              <div><label className="label">检验结论/备注</label><textarea rows="3" className="input" value={form.conclusion} onChange={e => setForm({...form, conclusion: e.target.value})} /></div>
              <div className="flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
                <button className="btn-primary" onClick={save}>提交</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BatchTab = ({ batches, order, reload, user }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ quantity: order.quantity, productionLine: order.equipmentId || "", responsibleId: "", traceRemark: "" });
  const create = async () => {
    const r = await fetch("/api/batches", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, workOrderId: order._id })
    });
    if (r.ok) { setShow(false); reload(); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">追溯批次：{batches.length} 个</div>
        <button className="btn-primary" onClick={() => setShow(true)}>＋ 新建追溯批次</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>批次号</th><th>产品</th><th>数量</th><th>产线</th><th>责任人</th><th>状态</th><th>生产时间</th><th>追溯备注</th></tr></thead>
          <tbody>
            {batches.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">暂无追溯批次</td></tr>}
            {batches.map(b => (
              <tr key={b._id}>
                <td className="font-mono font-medium text-brand-700">{b.batchNo}</td>
                <td>{b.productName}</td>
                <td>{b.quantity.toLocaleString()}</td>
                <td>{b.productionLine || "-"}</td>
                <td>{b.responsibleId?.name || "-"}</td>
                <td>{{ pending: "待生产", producing: "生产中", completed: "已完成", scrapped: "报废" }[b.status] && <span className={`badge ${{ pending: "bg-amber-100 text-amber-700", producing: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", scrapped: "bg-rose-100 text-rose-700" }[b.status]}`}>{{ pending: "待生产", producing: "生产中", completed: "已完成", scrapped: "报废" }[b.status]}</span>}</td>
                <td>{new Date(b.produceDate).toLocaleDateString("zh-CN")}</td>
                <td className="text-slate-600">{b.traceRemark || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="card-header"><h3 className="font-semibold">新建追溯批次</h3><button className="btn-ghost" onClick={() => setShow(false)}>✕</button></div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">批次数量</label><input type="number" className="input" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
                <div><label className="label">产线/设备</label><input className="input" value={form.productionLine} onChange={e => setForm({...form, productionLine: e.target.value})} /></div>
              </div>
              <div><label className="label">追溯备注/说明</label><textarea rows="3" className="input" value={form.traceRemark} onChange={e => setForm({...form, traceRemark: e.target.value})} /></div>
              <div className="flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShow(false)}>取消</button>
                <button className="btn-primary" onClick={create}>创建</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
