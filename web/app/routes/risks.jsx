import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { STATUS_MAP, MAT_MAP, StatusBadge, PriorityBadge } from "./workorders.jsx";

export default function RisksPage() {
  const [q, setQ] = useState({ riskType: "all", days: 3, keyword: "", page: 1, limit: 50 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ delivery: 0, material: 0, equipment: 0, quality: 0, overdue: 0 });

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q.riskType !== "all") p.set("riskType", q.riskType);
    p.set("days", q.days);
    if (q.keyword) p.set("keyword", q.keyword);
    p.set("page", q.page); p.set("limit", q.limit);
    const [r1, r2] = await Promise.all([
      fetch(`/api/risks?${p.toString()}`, { credentials: "include" }),
      fetch("/api/risks?riskType=delivery&days=9999", { credentials: "include" })
    ]);
    const d1 = await r1.json();
    setData(d1);
    const allR = await r2.json();
    const stats = { delivery: 0, material: 0, equipment: 0, quality: 0, overdue: 0 };
    allR.list.forEach(o => {
      if (o.materialStatus !== "ready") stats.material++;
      if (o.equipmentDown) stats.equipment++;
      if (o.qualityPassRate > 0 && o.qualityPassRate < 90) stats.quality++;
      const dl = Math.ceil((new Date(o.plannedEndDate) - new Date()) / 86400000);
      if (dl <= Number(q.days)) stats.delivery++;
      if (dl < 0) stats.overdue++;
    });
    setSummary(stats);
    setLoading(false);
  };
  useEffect(() => { load(); }, [q]);

  const exportExcel = () => {
    const p = new URLSearchParams();
    if (q.riskType !== "all") p.set("riskType", q.riskType);
    p.set("days", q.days);
    if (q.keyword) p.set("keyword", q.keyword);
    window.location.href = `/api/risks/export?${p.toString()}`;
  };

  const RiskCard = ({ label, value, cls, icon, active, onClick }) => (
    <button onClick={onClick} className={`card p-4 text-left transition-all ${active ? "ring-2 ring-brand-500 ring-offset-1" : "hover:shadow-md"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${cls}`}>{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-800 mt-0.5">{value}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <RiskCard label="全部风险工单" value={summary.delivery + summary.material + summary.equipment + summary.quality - 3 || 0} cls="bg-slate-100 text-slate-700" icon="📊" active={q.riskType === "all"} onClick={() => setQ({...q, riskType: "all", page: 1})} />
        <RiskCard label={`交期风险 (≤${q.days}天)`} value={summary.delivery} cls="bg-rose-100 text-rose-700" icon="⏰" active={q.riskType === "delivery"} onClick={() => setQ({...q, riskType: "delivery", page: 1})} />
        <RiskCard label="已逾期" value={summary.overdue} cls="bg-red-100 text-red-700" icon="🔥" active={false} onClick={() => setQ({...q, riskType: "delivery", days: 0, page: 1})} />
        <RiskCard label="物料齐套异常" value={summary.material} cls="bg-amber-100 text-amber-700" icon="📦" active={q.riskType === "material"} onClick={() => setQ({...q, riskType: "material", page: 1})} />
        <RiskCard label="设备停机" value={summary.equipment} cls="bg-orange-100 text-orange-700" icon="⚙️" active={q.riskType === "equipment"} onClick={() => setQ({...q, riskType: "equipment", page: 1})} />
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input className="input w-56" placeholder="🔍 搜索工单号/产品" value={q.keyword} onChange={e => setQ({...q, keyword: e.target.value, page: 1})} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">交期阈值</span>
              <select className="select w-24" value={q.days} onChange={e => setQ({...q, days: e.target.value, page: 1})}>
                <option value="1">1 天</option><option value="3">3 天</option><option value="5">5 天</option><option value="7">7 天</option><option value="14">14 天</option><option value="30">30 天</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={load}>🔄 刷新</button>
            <button className="btn-primary" onClick={exportExcel}>📥 下载 Excel</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>工单号</th><th>产品名称</th><th>数量</th><th>优先级</th>
                <th>状态</th><th>计划交期</th><th>剩余天数</th><th>责任人</th>
                <th>物料</th><th>设备</th><th>合格率</th><th>风险标签</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={13} className="text-center py-10 text-slate-400">分析中...</td></tr>}
              {!loading && data?.list?.length === 0 && <tr><td colSpan={13} className="text-center py-10 text-slate-400">🎉 当前筛选条件下无风险工单</td></tr>}
              {!loading && data?.list?.map(o => {
                const dl = Math.ceil((new Date(o.plannedEndDate) - new Date()) / 86400000);
                return (
                  <tr key={o._id}>
                    <td className="font-mono text-brand-700 font-medium">{o.orderNo}</td>
                    <td>{o.productName}</td>
                    <td>{o.quantity.toLocaleString()}</td>
                    <td><PriorityBadge p={o.priority} /></td>
                    <td><StatusBadge s={o.status} /></td>
                    <td>{new Date(o.plannedEndDate).toLocaleDateString("zh-CN")}</td>
                    <td>
                      <span className={`font-bold ${dl < 0 ? "text-red-600" : dl <= 1 ? "text-rose-600" : dl <= 3 ? "text-amber-600" : "text-slate-700"}`}>
                        {dl < 0 ? `逾期 ${-dl} 天` : `${dl} 天`}
                      </span>
                    </td>
                    <td className="text-sm">{o.ownerId?.name || "-"}</td>
                    <td>{MAT_MAP[o.materialStatus] && <span className={`badge ${MAT_MAP[o.materialStatus].cls}`}>{MAT_MAP[o.materialStatus].label}</span>}</td>
                    <td>{o.equipmentDown ? <span className="badge bg-orange-100 text-orange-700">停机</span> : <span className="text-emerald-600 text-sm">正常</span>}</td>
                    <td>
                      {o.qualityPassRate > 0 ? (
                        <span className={o.qualityPassRate < 90 ? "text-rose-600 font-medium" : "text-emerald-600"}>{o.qualityPassRate}%</span>
                      ) : "-"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {o.riskFlags?.map(f => <span key={f} className="badge bg-rose-50 text-rose-600 border border-rose-200">{f}</span>)}
                      </div>
                    </td>
                    <td><Link to={`/workorders/${o._id}`} className="text-brand-600 hover:underline text-sm">处理</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && data.total > q.limit && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">共 {data.total} 条风险记录</div>
            <div className="flex gap-1">
              <button className="btn-secondary" disabled={q.page <= 1} onClick={() => setQ({...q, page: q.page - 1})}>上一页</button>
              <span className="px-3 py-2 text-sm">第 {q.page} 页</span>
              <button className="btn-secondary" disabled={q.page >= Math.ceil(data.total / q.limit)} onClick={() => setQ({...q, page: q.page + 1})}>下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
