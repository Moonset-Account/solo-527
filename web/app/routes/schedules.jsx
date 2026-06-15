import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { useOutletContext } from "@remix-run/react";

export default function SchedulesPage() {
  const { user } = useOutletContext();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const [viewStart, setViewStart] = useState(startOfWeek);
  const [view, setView] = useState("week");
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [lines] = useState(["CNC-01", "CNC-02", "CNC-03", "CNC-04", "装配线A", "装配线B"]);

  const load = async () => {
    const from = new Date(viewStart);
    const to = new Date(viewStart);
    to.setDate(from.getDate() + (view === "week" ? 6 : 13));
    const r = await fetch(`/api/schedules?from=${from.toISOString()}&to=${to.toISOString()}`, { credentials: "include" });
    if (r.ok) setData((await r.json()).list);
  };
  useEffect(() => { load(); }, [viewStart, view]);

  const days = [];
  for (let i = 0; i < (view === "week" ? 7 : 14); i++) {
    const d = new Date(viewStart); d.setDate(viewStart.getDate() + i);
    days.push(d);
  }

  const shiftColors = { full: "bg-brand-500", morning: "bg-emerald-500", afternoon: "bg-amber-500", night: "bg-purple-600" };

  const exportIcs = () => {
    const lines = data.map(s => {
      const d = new Date(s.plannedDate).toISOString().slice(0,10).replace(/-/g,'');
      const no = s.workOrderId?.orderNo || "WO";
      return `BEGIN:VEVENT\nDTSTART:${d}\nSUMMARY:${no} ${s.workOrderId?.productName || ""} - ${s.productionLine}\nEND:VEVENT`;
    }).join("\n");
    const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\n${lines}\nEND:VCALENDAR`], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `生产排期-${viewStart.toISOString().slice(0,10)}.ics`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button className="px-3 py-1.5 hover:bg-slate-50 text-sm" onClick={() => { const d = new Date(viewStart); d.setDate(d.getDate() - (view === "week" ? 7 : 14)); setViewStart(d); }}>‹ 上一周期</button>
              <div className="px-4 py-1.5 text-sm font-medium bg-slate-50 border-x border-slate-200">
                {days[0].toLocaleDateString("zh-CN")} ~ {days[days.length - 1].toLocaleDateString("zh-CN")}
              </div>
              <button className="px-3 py-1.5 hover:bg-slate-50 text-sm" onClick={() => { const d = new Date(viewStart); d.setDate(d.getDate() + (view === "week" ? 7 : 14)); setViewStart(d); }}>下一周期 ›</button>
            </div>
            <select className="select w-28" value={view} onChange={e => setView(e.target.value)}>
              <option value="week">周视图</option><option value="2week">两周视图</option>
            </select>
            <button className="btn-ghost text-sm" onClick={() => setViewStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)))}>本周</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={exportIcs}>📥 导出日历</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}>＋ 新建排期</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table" style={{ tableLayout: "fixed", minWidth: (days.length * 120 + 140) + "px" }}>
            <thead>
              <tr>
                <th style={{ width: 140, position: "sticky", left: 0, background: "#f8fafc", zIndex: 2 }}>产线 / 设备</th>
                {days.map(d => {
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <th key={d.toISOString()} className="text-center" style={{ width: 120 }}>
                      <div className={isToday ? "text-brand-700 font-bold" : ""}>
                        {["一","二","三","四","五","六","日"][d.getDay() === 0 ? 6 : d.getDay() - 1]}
                      </div>
                      <div className={`text-xs mt-0.5 ${isToday ? "badge bg-brand-500 text-white" : ""}`}>
                        {d.getMonth() + 1}/{d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line}>
                  <td style={{ position: "sticky", left: 0, background: "#fff", zIndex: 1 }} className="font-medium bg-slate-50/50">{line}</td>
                  {days.map(d => {
                    const items = data.filter(s => s.productionLine === line && new Date(s.plannedDate).toDateString() === d.toDateString());
                    return (
                      <td key={d.toISOString()} className="!p-1 align-top" style={{ height: 64 }}>
                        {items.map(s => (
                          <Link key={s._id} to={`/workorders/${s.workOrderId?._id}`}
                            className={`block mb-1 rounded px-2 py-1.5 text-white ${shiftColors[s.shift] || "bg-slate-500"} hover:opacity-80 transition-opacity`}
                            title={`${s.workOrderId?.orderNo} - ${s.workOrderId?.productName}`}>
                            <div className="text-[11px] font-bold truncate">{s.workOrderId?.orderNo}</div>
                            <div className="text-[10px] opacity-90 truncate">{s.workOrderId?.productName?.slice(0,8)} / {s.workOrderId?.quantity}</div>
                          </Link>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-500" />全天</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />白班</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" />中班</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600" />夜班</span>
          <span className="ml-auto text-slate-400">点击排期块可跳转到对应工单</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-sm">📋 近期排期明细</h3></div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>日期</th><th>班次</th><th>产线</th><th>工单号</th><th>产品</th><th>数量</th><th>工时</th><th>备注</th><th></th></tr></thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">暂无排期</td></tr>}
              {data.sort((a,b) => new Date(a.plannedDate) - new Date(b.plannedDate)).slice(0, 50).map(s => (
                <tr key={s._id}>
                  <td>{new Date(s.plannedDate).toLocaleDateString("zh-CN")}</td>
                  <td>{{ full: "全天", morning: "白班", afternoon: "中班", night: "夜班" }[s.shift]}</td>
                  <td>{s.productionLine || "-"}</td>
                  <td className="font-mono text-brand-700">{s.workOrderId?.orderNo}</td>
                  <td>{s.workOrderId?.productName}</td>
                  <td>{s.workOrderId?.quantity?.toLocaleString()}</td>
                  <td>{s.plannedHours}h</td>
                  <td className="text-slate-600 text-sm">{s.notes || "-"}</td>
                  <td><Link to={`/workorders/${s.workOrderId?._id}`} className="text-brand-600 hover:underline text-sm">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <ScheduleFormModal onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ScheduleFormModal({ onClose, onDone }) {
  const [form, setForm] = useState({ workOrderId: "", productionLine: "", plannedDate: "", shift: "full", plannedHours: 8, notes: "" });
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch("/api/workorders?limit=100", { credentials: "include" }).then(r => r.json()).then(d => setOrders(d.list || []));
  }, []);
  const submit = async () => {
    if (!form.workOrderId || !form.plannedDate) return alert("请选择工单和日期");
    const r = await fetch("/api/schedules", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) onDone(); else alert("保存失败");
  };
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">新建排期</h3><button className="btn-ghost" onClick={onClose}>✕</button></div>
        <div className="card-body space-y-4">
          <div><label className="label">关联工单 *</label>
            <select className="select" value={form.workOrderId} onChange={e => { setForm({...form, workOrderId: e.target.value}); const o = orders.find(x => x._id === e.target.value); if (o) setForm(f => ({...f, productionLine: o.equipmentId || f.productionLine})); }}>
              <option value="">-- 选择工单 --</option>
              {orders.filter(o => o.status !== "completed" && o.status !== "cancelled").map(o => <option key={o._id} value={o._id}>{o.orderNo} - {o.productName} ({o.quantity}件)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">排期日期 *</label><input type="date" className="input" value={form.plannedDate} onChange={e => setForm({...form, plannedDate: e.target.value})} /></div>
            <div><label className="label">班次</label>
              <select className="select" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
                <option value="full">全天</option><option value="morning">白班</option><option value="afternoon">中班</option><option value="night">夜班</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">产线/设备</label><input className="input" placeholder="如 CNC-01" value={form.productionLine} onChange={e => setForm({...form, productionLine: e.target.value})} /></div>
            <div><label className="label">计划工时 (h)</label><input type="number" className="input" value={form.plannedHours} onChange={e => setForm({...form, plannedHours: Number(e.target.value)})} /></div>
          </div>
          <div><label className="label">备注</label><textarea rows="2" className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>取消</button>
            <button className="btn-primary" onClick={submit}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
