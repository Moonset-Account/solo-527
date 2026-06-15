import { useEffect, useState } from "react";
import { Link, useOutletContext } from "@remix-run/react";
import { STATUS_MAP, MAT_MAP, StatusBadge, PriorityBadge } from "./workorders.jsx";

export default function DailyPage() {
  const { user } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/workorders?limit=100&status=in_production", { credentials: "include" });
    if (r.ok) { const d = await r.json(); setOrders(d.list); if (d.list.length && !activeId) setActiveId(d.list[0]._id); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const active = orders.find(o => o._id === activeId);
  const [detail, setDetail] = useState(null);
  const loadDetail = async (id) => {
    const r = await fetch(`/api/workorders/${id}`, { credentials: "include" });
    if (r.ok) setDetail(await r.json());
  };
  useEffect(() => { if (activeId) loadDetail(activeId); }, [activeId]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const saveDaily = async (patch) => {
    const r = await fetch(`/api/workorders/${activeId}/daily`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (r.ok) { flash("✅ 已更新"); await Promise.all([load(), loadDetail(activeId)]); }
    else { const d = await r.json(); alert(d.error); }
  };

  const saveMaterial = async (items) => {
    const r = await fetch("/api/materials", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: activeId, items, remark: detail?.materials?.remark || "" })
    });
    if (r.ok) { flash("✅ 物料齐套已更新"); await Promise.all([load(), loadDetail(activeId)]); }
  };

  const saveInspection = async (body) => {
    const r = await fetch("/api/inspections", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, workOrderId: activeId })
    });
    if (r.ok) { flash("✅ 质检结果已录入"); await Promise.all([load(), loadDetail(activeId)]); return true; }
    return false;
  };

  return (
    <div className="space-y-4">
      {msg && <div className="fixed top-20 right-6 z-50 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-lg text-sm animate-pulse">{msg}</div>}

      <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 10rem)" }}>
        <aside className="col-span-3 card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-sm">📋 在制工单清单</h3>
            <p className="text-xs text-slate-500 mt-0.5">共 {orders.length} 单进行中，点击切换</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && <div className="p-6 text-center text-slate-400 text-sm">加载中...</div>}
            {!loading && orders.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">暂无在制工单</div>}
            {orders.map(o => (
              <button key={o._id} onClick={() => setActiveId(o._id)}
                className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${activeId === o._id ? "bg-brand-50 border-l-4 border-brand-600" : "border-l-4 border-transparent"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-sm font-semibold text-brand-700 truncate">{o.orderNo}</div>
                  <PriorityBadge p={o.priority} />
                </div>
                <div className="text-sm text-slate-700 truncate mt-0.5">{o.productName}</div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-500">完成度 {Math.round((o.producedQty || 0) / o.quantity * 100)}%</span>
                  {o.equipmentDown && <span className="text-rose-600 font-medium">⚠ 停机</span>}
                </div>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: Math.min(100, Math.round((o.producedQty || 0) / o.quantity * 100)) + "%" }} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="col-span-9 space-y-4 overflow-y-auto pr-1">
          {!active && <div className="card card-body text-center text-slate-400 py-20">← 请选择左侧工单开始日常处理</div>}
          {active && detail && (
            <>
              <div className="card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold font-mono">{active.orderNo}</h2>
                      <StatusBadge s={active.status} />
                      <PriorityBadge p={active.priority} />
                      {active.riskFlags?.slice(0,3).map(f => <span key={f} className="badge bg-rose-50 text-rose-600 border border-rose-200">{f}</span>)}
                    </div>
                    <div className="text-lg font-medium text-slate-800">{active.productName}</div>
                    <div className="text-sm text-slate-500 mt-0.5">数量 {active.quantity.toLocaleString()} · 客户 {active.customer || "-"} · 设备 {active.equipmentId || "-"} · 责任人 {active.ownerId?.name || "-"}</div>
                  </div>
                  <Link to={`/workorders/${active._id}`} className="btn-ghost">查看完整详情 →</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="card-header"><h3 className="font-semibold text-sm">🔢 产量工时（直接在此更新，无需跳转）</h3></div>
                  <div className="card-body space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label">累计产量 (件)</label>
                        <input type="number" className="input text-lg font-semibold"
                          defaultValue={active.producedQty || 0}
                          onBlur={e => saveDaily({ producedQty: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">累计工时 (小时)</label>
                        <input type="number" step="0.5" className="input text-lg font-semibold"
                          defaultValue={active.workHours || 0}
                          onBlur={e => saveDaily({ workHours: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">完成率</label>
                        <div className="input text-lg font-semibold bg-slate-50 text-slate-700">
                          {Math.min(100, Math.round(((active.producedQty || 0) / active.quantity) * 100))}%
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">进度条</div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all" style={{ width: Math.min(100, Math.round(((active.producedQty || 0) / active.quantity) * 100)) + "%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3 className="font-semibold text-sm">📝 关键字段 + 备注（同屏管理，少跳转）</h3></div>
                  <div className="card-body space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">状态（变更自动留痕）</label>
                        <select className="select" value={active.status}
                          onChange={async e => {
                            const r = await fetch(`/api/workorders/${active._id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
                            if (r.ok) { flash("✅ 状态已变更，日志已记录"); await Promise.all([load(), loadDetail(activeId)]); }
                          }}>
                          {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">设备停机标记</label>
                        <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 input !pl-3">
                          <input type="checkbox" checked={!!active.equipmentDown}
                            onChange={async e => {
                              const remark = e.target.checked ? prompt("请输入停机原因：", active.remark || "") : active.remark;
                              const r = await fetch(`/api/workorders/${active._id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ equipmentDown: e.target.checked, remark }) });
                              if (r.ok) { flash(e.target.checked ? "✅ 停机事件已记录日志" : "✅ 设备恢复生产"); await Promise.all([load(), loadDetail(activeId)]); }
                            }} className="w-4 h-4 accent-rose-600" />
                          <span className={`text-sm ${active.equipmentDown ? "text-rose-600 font-semibold" : ""}`}>
                            {active.equipmentDown ? "⚠️ 当前停机中（日志已记录）" : "正常生产"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="label">备注 / 变更说明 / 异常记录（集中一处）</label>
                      <textarea rows="4" className="input" defaultValue={active.remark || ""}
                        onBlur={e => saveDaily({ remark: e.target.value })}
                        placeholder="今日进度说明、异常情况、变更原因、需要协调的问题..." />
                      <div className="text-xs text-slate-500 mt-1">💡 备注与关键处理面板同屏，避免来回跳转；所有关键字段修改自动写入审计日志。</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold text-sm">📦 物料齐套（同屏维护）</h3>
                    {detail?.materials?.overallStatus && <span className={`badge ${MAT_MAP[detail.materials.overallStatus].cls}`}>{MAT_MAP[detail.materials.overallStatus].label}</span>}
                  </div>
                  <div className="card-body p-0">
                    <table className="table !border-collapse">
                      <thead><tr><th>物料</th><th>需求</th><th>已备</th><th>状态</th></tr></thead>
                      <tbody>
                        {!detail?.materials?.items?.length && <tr><td colSpan={4} className="text-center py-4 text-slate-400 text-sm">暂无物料数据</td></tr>}
                        {detail?.materials?.items?.map((it, i) => (
                          <tr key={i}>
                            <td>
                              <div className="font-medium">{it.name || it.code}</div>
                              <div className="text-xs text-slate-500">{it.code}</div>
                            </td>
                            <td>{it.requiredQty} {it.unit}</td>
                            <td>
                              <input type="number" className="input !py-1 !w-20" defaultValue={it.preparedQty}
                                onBlur={async e => {
                                  const items = [...detail.materials.items];
                                  items[i] = { ...items[i], preparedQty: Number(e.target.value) || 0 };
                                  await saveMaterial(items);
                                }} />
                            </td>
                            <td>{it.preparedQty >= it.requiredQty ? <span className="badge bg-emerald-100 text-emerald-700">齐套</span> : it.preparedQty > 0 ? <span className="badge bg-amber-100 text-amber-700">部分</span> : <span className="badge bg-rose-100 text-rose-700">缺料</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold text-sm">🔬 质检结果（快速录入）</h3>
                    <span className={`badge ${active.qualityPassRate > 0 ? (active.qualityPassRate >= 95 ? "bg-emerald-100 text-emerald-700" : active.qualityPassRate >= 90 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700") : "bg-slate-100 text-slate-600"}`}>
                      当前合格率 {active.qualityPassRate > 0 ? active.qualityPassRate + "%" : "未录入"}
                    </span>
                  </div>
                  <QuickInspectionForm onSubmit={saveInspection} />
                  {detail?.inspections?.length > 0 && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {detail.inspections.slice(0, 3).map(ins => (
                        <div key={ins._id} className="px-4 py-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">{new Date(ins.inspectDate).toLocaleString("zh-CN")}</span>
                            <span className={`badge ${ins.result === "pass" ? "bg-emerald-100 text-emerald-700" : ins.result === "fail" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                              {{ pass: "合格", fail: "不合格", rework: "返工", pending: "待判定" }[ins.result]}
                            </span>
                          </div>
                          <div className="mt-1">抽检 {ins.sampleSize} | 合格 {ins.passQty} | 不合格 {ins.failQty} | 合格率 {ins.sampleSize > 0 ? Math.round(ins.passQty / ins.sampleSize * 10000) / 100 : 0}%</div>
                          {ins.conclusion && <div className="text-slate-600 mt-0.5 text-xs">💬 {ins.conclusion}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function QuickInspectionForm({ onSubmit }) {
  const [f, setF] = useState({ sampleSize: 50, passQty: 48, failQty: 2, result: "pass", conclusion: "" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    const ok = await onSubmit(f);
    if (ok) setF({ sampleSize: 50, passQty: 48, failQty: 2, result: "pass", conclusion: "" });
    setSaving(false);
  };
  return (
    <div className="card-body space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label text-xs">抽样数</label><input type="number" className="input !py-1.5" value={f.sampleSize} onChange={e => setF({...f, sampleSize: Number(e.target.value)})} /></div>
        <div><label className="label text-xs">合格数</label><input type="number" className="input !py-1.5" value={f.passQty} onChange={e => setF({...f, passQty: Number(e.target.value)})} /></div>
        <div><label className="label text-xs">不合格数</label><input type="number" className="input !py-1.5" value={f.failQty} onChange={e => setF({...f, failQty: Number(e.target.value)})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label text-xs">判定</label>
          <select className="select !py-1.5" value={f.result} onChange={e => setF({...f, result: e.target.value})}>
            <option value="pass">合格</option><option value="rework">需返工</option><option value="fail">不合格</option>
          </select>
        </div>
        <button onClick={submit} disabled={saving} className="btn-primary mt-[18px] !py-1.5">
          {saving ? "提交中..." : "📝 快速录入"}
        </button>
      </div>
      <div><label className="label text-xs">简要结论</label><input className="input !py-1.5" value={f.conclusion} onChange={e => setF({...f, conclusion: e.target.value})} /></div>
    </div>
  );
}
