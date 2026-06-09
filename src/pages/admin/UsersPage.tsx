import { useState } from 'react';
import {
  Users2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Edit3,
  ChevronDown,
} from 'lucide-react';
import { mockUsers } from '@/lib/mockData';
import type { User, Role } from '#shared/types';
import { cn } from '@/lib/utils';

const roleConfig: Record<Role, { label: string; icon: typeof Shield; cls: string; bg: string }> = {
  admin: { label: '系统管理员', icon: Crown, cls: 'text-rose-700', bg: 'bg-rose-100 ring-rose-200' },
  manager: { label: '项目经理', icon: Shield, cls: 'text-primary-700', bg: 'bg-primary-100 ring-primary-200' },
  reviewer: { label: '质量审核员', icon: ShieldCheck, cls: 'text-violet-700', bg: 'bg-violet-100 ring-violet-200' },
  member: { label: '团队成员', icon: Users2, cls: 'text-slate-700', bg: 'bg-slate-100 ring-slate-200' },
};

const roleOrder: Role[] = ['admin', 'manager', 'reviewer', 'member'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = users.filter((u) => {
    const matchSearch = [u.name, u.email].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const changeRole = (id: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理平台用户与角色权限 · 共 {users.length} 名用户</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roleOrder.map((role) => {
          const rc = roleConfig[role];
          const Icon = rc.icon;
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-inset', rc.bg)}>
                  <Icon className={cn('h-5 w-5', rc.cls)} />
                </div>
                <span className="text-2xl font-bold text-slate-800">{count}</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-800">{rc.label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索用户名或邮箱..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white"
          >
            <option value="all">全部角色</option>
            {roleOrder.map((r) => (
              <option key={r} value={r}>
                {roleConfig[r].label}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 text-left font-medium">用户</th>
                <th className="px-5 py-3.5 text-left font-medium">邮箱</th>
                <th className="px-5 py-3.5 text-left font-medium">角色</th>
                <th className="px-5 py-3.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const rc = roleConfig[u.role];
                const Icon = rc.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-semibold shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800">{u.name}</div>
                          <div className="text-xs text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600 font-mono text-xs">{u.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative group inline-block">
                        <button className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ring-inset',
                          rc.bg,
                          rc.cls
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                          {rc.label}
                          <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        </button>
                        <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block z-10">
                          {roleOrder.map((r) => {
                            const rrc = roleConfig[r];
                            const RI = rrc.icon;
                            return (
                              <button
                                key={r}
                                onClick={() => changeRole(u.id, r)}
                                className={cn(
                                  'w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors',
                                  u.role === r && 'bg-primary-50 text-primary-700 font-semibold'
                                )}
                              >
                                <RI className={cn('h-3.5 w-3.5', rrc.cls)} />
                                {rrc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                        <Edit3 className="h-3.5 w-3.5" />
                        编辑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-400 text-sm">
                    <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    没有匹配的用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
