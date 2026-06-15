import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";

const CATEGORY_LABEL = {
  auth: { label: "鉴权", cls: "bg-slate-100 text-slate-700" },
  equipment_down: { label: "设备停机", cls: "bg-orange-100 text-orange-700" },
  key_field_change: { label: "关键字段修改", cls: "bg-brand-100 text-brand-700" },
  status_change: { label: "状态变更", cls: "bg-sky-100 text-sky-700" },
  batch: { label: "批次操作", cls: "bg-purple-100 text-purple-700" },
  risk: { label: "风险", cls: "bg-rose-100 text-rose-700" },
  system: { label: "系统", cls: "bg-slate-100 text-slate-700" }
};

export default function LogsPage() {
  const [q, setQ] = useState({ category: "", keyword: "", from: "", to: "", page: 1, limit: 50 });
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q.category) p.set("category", q.category);
    if (q.keyword) p.set("keyword", q.keyword);
    if (q.from) p.set("from", q.from);
    if (q.to) p.set("to", q.to);
    p.set("page", q.page); p.set("limit", q.limit);
    const [r1, r2] = await Promise.all([
      fetch(`/api/logs?${p.toString()}`, { credentials: "include" }),
      fetch(`/api/logs/stats`, { credentials: "include" })
    ]);
    if (r1.status === 403) {
      alert("⚠️ 该模块仅限管理员访问");
      window.location.href = "/workorders";
      return;
    }
    setData(await r1.json());
    if (r2.ok) setStats(await r2.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, [q]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(CATEGORY_LABEL).map(([k, v]) => {
          const count = stats?.byCategory?.find(s => s._id === k)?.count || 0;
          const active = q.category === k;
          return (
            <button key={k} onClick={() => setQ({...q, category: active ? "" : k, page: 1})}
              className={`card p-3 text-left transition-all ${active ? "ring-2 ring-brand-500 ring-offset-1" : "hover:shadow-md"}`}>
              <div className={`badge w-fit ${v.cls}`}>{v.label}</div>
              <div className="text-2xl font-bold mt-2 text-slate-800">{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">近 30 天</div>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select className="select w-44" value={q.category} onChange={e => setQ({...q, category: e.target.value, page: 1})}>
              <option value="">全部类别</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input className="input w-56" placeholder="🔍 操作/用户/工单号/详情" value={q.keyword} onChange={e => setQ({...q, keyword: e.target.value, page: 1})} />
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <span>日期:</span>
              <input type="date" className="input !w-36" value={q.from} onChange={e => setQ({...q, from: e.target.value, page: 1})} />
              <span>~</span>
              <input type="date" className="input !w-36" value={q.to} onChange={e => setQ({...q, to: e.target.value, page: 1})} />
            </div>
          </div>
          <button className="btn-secondary" onClick={load}>🔄 刷新</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>时间</th>
                <th style={{ width: 110 }}>类别</th>
                <th style={{ width: 140 }}>操作</th>
                <th style={{ width: 140 }}>用户</th>
                <th style={{ width: 130 }}>关联对象</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-slate-400">加载中...</td></tr>}
              {!loading && data?.list?.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">暂无操作日志</td></tr>}
              {!loading && data?.list?.map(log => (
                <tr key={log._id}>
                  <td>
                    <div className="text-sm">{new Date(log.timestamp).toLocaleString("zh-CN")}</div>
                    {log.ip && <div className="text-xs text-slate-400 mt-0.5">IP: {log.ip.replace("::ffff:", "")}</div>}
                  </td>
                  <td>
                    {CATEGORY_LABEL[log.category] ? (
                      <span className={`badge ${CATEGORY_LABEL[log.category].cls}`}>{CATEGORY_LABEL[log.category].label}</span>
                    ) : log.category}
                  </td>
                  <td className="font-medium text-slate-800">{log.action}</td>
                  <td>
                    <div className="text-sm">{log.username || "-"}</div>
                    {log.userRole && <div className="text-xs text-slate-500">{log.userRole === "admin" ? "管理员" : "计划员"}</div>}
                  </td>
                  <td>
                    {log.targetNo && (
                      <div>
                        <div className="text-xs text-slate-500">{log.targetModel}</div>
                        <div className="font-mono text-sm">
                          {log.targetModel === "WorkOrder" ? (
                            <Link to={`/workorders/${log.targetId}`} className="text-brand-600 hover:underline">{log.targetNo}</Link>
                          ) : log.targetNo}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">{log.detail || "-"}</div>
                    {log.fieldChanges?.length > 0 && (
                      <details className="mt-1.5">
                        <summary className="text-xs text-brand-600 cursor-pointer hover:underline">
                          查看字段变更明细 ({log.fieldChanges.length} 处)
                        </summary>
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                          {log.fieldChanges.map((c, i) => {
                            const oldV = c.oldValue instanceof Date ? new Date(c.oldValue).toLocaleString("zh-CN") : String(c.oldValue ?? "(空)");
                            const newV = c.newValue instanceof Date ? new Date(c.newValue).toLocaleString("zh-CN") : String(c.newValue ?? "(空)");
                            return (
                              <div key={i} className="flex items-start gap-2 flex-wrap">
                                <span className="font-mono font-medium text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{c.field}</span>
                                <span className="text-rose-600 line-through">“{oldV}”</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-emerald-600 font-medium">“{newV}”</span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.total > q.limit && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">共 {data.total} 条记录</div>
            <div className="flex gap-1">
              <button className="btn-secondary" disabled={q.page <= 1} onClick={() => setQ({...q, page: q.page - 1})}>上一页</button>
              <span className="px-3 py-2 text-sm">第 {q.page} 页</span>
              <button className="btn-secondary" disabled={q.page >= Math.ceil(data.total / q.limit)} onClick={() => setQ({...q, page: q.page + 1})}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {stats?.byDay && stats.byDay.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-sm">📈 近 30 天操作趋势</h3></div>
          <div className="card-body">
            <LogChart data={stats.byDay} />
          </div>
        </div>
      )}
    </div>
  );
}

function LogChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 900, H = 180, P = 30;
  const points = data.map((d, i) => {
    const x = P + (i * (W - P * 2)) / Math.max(1, data.length - 1);
    const y = H - P - ((d.count / max) * (H - P * 2));
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${H - P} L ${points[0].x} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 180 }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <line key={i} x1={P} x2={W - P} y1={H - P - r * (H - P * 2)} y2={H - P - r * (H - P * 2)} stroke="#e2e8f0" strokeDasharray="3 3" />
      ))}
      <path d={area} fill="url(#g1)" />
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
      {points.map((p, i) => i % 3 === 0 && (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
          <text x={p.x} y={H - 8} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
            {p._id.slice(5)}
          </text>
          <text x={p.x} y={p.y - 6} textAnchor="middle" className="fill-slate-700 font-medium" style={{ fontSize: 10 }}>
            {p.count}
          </text>
        </g>
      ))}
    </svg>
  );
}
