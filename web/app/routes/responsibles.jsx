import { useEffect, useState } from "react";
import { useOutletContext } from "@remix-run/react";

export default function ResponsiblesPage() {
  const { user } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/workorders?limit=1", { credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    const r2 = await fetch("/api/workorders?limit=1000", { credentials: "include" });
    const d = await r2.json();
    const m = new Map();
    d.list.forEach(o => {
      if (o.ownerId) {
        const k = o.ownerId._id || String(o.ownerId);
        if (!m.has(k)) m.set(k, { ...o.ownerId, orderCount: 0, producedTotal: 0, completedCount: 0 });
        const e = m.get(k);
        e.orderCount++;
        e.producedTotal += o.producedQty || 0;
        if (o.status === "completed") e.completedCount++;
      }
    });
    setUsers(Array.from(m.values()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="责任人总数" value={users.length} icon="👥" cls="bg-brand-100 text-brand-700" />
        <StatCard label="计划员" value={users.filter(u => u.role === "planner").length} icon="📋" cls="bg-sky-100 text-sky-700" />
        <StatCard label="管理员" value={users.filter(u => u.role === "admin").length} icon="🛡️" cls="bg-purple-100 text-purple-700" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">责任人 / 用户管理</h3>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={load}>🔄 刷新</button>
            <button className="btn-primary" onClick={() => setShow(true)}>＋ 新增责任人</button>
          </div>
        </div>
        {err && <div className="px-5 py-3 bg-rose-50 text-rose-700 text-sm border-b border-rose-100">{err}</div>}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>头像</th><th>姓名</th><th>用户名</th><th>角色</th>
                <th>部门</th><th>负责工单数</th><th>已完成</th><th>累计产出</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="text-center py-10 text-slate-400">加载中...</td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-slate-400">暂无责任人数据，运行 npm run seed 可初始化</td></tr>}
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                      {u.name?.charAt(0) || u.username?.charAt(0)}
                    </div>
                  </td>
                  <td className="font-medium">{u.name}</td>
                  <td className="text-slate-500 font-mono text-sm">{u.username}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
                      {u.role === "admin" ? "管理员" : "计划员"}
                    </span>
                  </td>
                  <td className="text-sm text-slate-600">{u.department || "-"}</td>
                  <td><span className="font-semibold">{u.orderCount}</span> 单</td>
                  <td className="text-emerald-600">{u.completedCount} 单</td>
                  <td className="font-mono">{u.producedTotal.toLocaleString()} 件</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="text-brand-600 hover:underline text-sm" onClick={() => alert(`编辑功能：${u.name}\\n（通过 Mongo 或扩展 API 实现）`)}>编辑</button>
                      {u.role !== "admin" && <button className="text-rose-500 hover:underline text-sm">停用</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && <CreateUserModal onClose={() => { setShow(false); setErr(""); }} onDone={() => { setShow(false); load(); }} setErr={setErr} />}
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

function CreateUserModal({ onClose, onDone, setErr }) {
  const [f, setF] = useState({ username: "", password: "", name: "", role: "planner", department: "" });
  const submit = async () => {
    if (!f.username || !f.password || !f.name) return setErr("用户名、密码、姓名为必填");
    const r = await fetch("/api/workorders?limit=1", { credentials: "include" });
    alert(`用户创建 API 需扩展：这里演示注册流程。\\n已输入: ${f.username} / ${f.name}`);
    onDone();
  };
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="card-header"><h3 className="font-semibold">新增责任人 / 用户</h3><button className="btn-ghost" onClick={onClose}>✕</button></div>
        <div className="card-body space-y-4">
          <div><label className="label">登录用户名 *</label><input className="input" value={f.username} onChange={e => setF({...f, username: e.target.value})} placeholder="如 zhangsan" /></div>
          <div><label className="label">姓名 *</label><input className="input" value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="如 张三" /></div>
          <div><label className="label">初始密码 *</label><input type="password" className="input" value={f.password} onChange={e => setF({...f, password: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">角色</label>
              <select className="select" value={f.role} onChange={e => setF({...f, role: e.target.value})}>
                <option value="planner">计划员</option><option value="admin">管理员</option>
              </select>
            </div>
            <div><label className="label">部门</label><input className="input" value={f.department} onChange={e => setF({...f, department: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button className="btn-secondary" onClick={onClose}>取消</button>
            <button className="btn-primary" onClick={submit}>创建</button>
          </div>
        </div>
      </div>
    </div>
  );
}
