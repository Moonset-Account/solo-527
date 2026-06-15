'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users2,
  Search,
  Filter,
  Plus,
  Shield,
  Building2,
  RefreshCw,
  Loader2,
  Inbox,
  X,
  Check,
  ChevronDown,
  UserRound,
  Mail,
  Lock,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { cn, ROLE_LABEL } from '@/lib/utils';
import type { UserRole } from '@/types';

interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  department?: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { assignedTasks: number };
}

interface PagedUsers {
  total: number;
  page: number;
  pageSize: number;
  items: UserItem[];
}

const ROLE_OPTIONS: UserRole[] = ['USER', 'ADMIN_LEAD', 'ADMIN'];

export default function UsersPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', { keyword, roleFilter, departmentFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (departmentFilter !== 'ALL') params.set('department', departmentFilter);
      params.set('pageSize', '50');
      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PagedUsers;
    },
    enabled: !!user && user?.role === 'ADMIN',
  });

  const users = data?.items || [];

  const departments = useMemo(() => {
    const set = new Set<string>();
    (data?.items || []).forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [data?.items]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      id,
      newRole,
    }: {
      id: string;
      newRole: UserRole;
    }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast('角色已更新', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast(vars.active ? '账号已启用' : '账号已禁用', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const createUserMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['simple-users'] });
      toast('用户创建成功', 'success');
      setCreateOpen(false);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-primary" />
            用户管理
            {data?.total !== undefined && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                共 {data.total} 位用户
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            管理平台用户，分配角色权限，启用/禁用账号
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-secondary !px-3 !py-2"
            title="刷新"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建用户
          </button>
        </div>
      </div>

      <div className="card-base p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索用户名、姓名、邮箱..."
            className="input-base pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-base !w-auto min-w-[140px] !py-2"
          >
            <option value="ALL">全部角色</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]?.label || r}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input-base !w-auto min-w-[140px] !py-2"
          >
            <option value="ALL">全部部门</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              暂无用户
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              当前筛选条件下没有用户，可点击右上角新建用户。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-slate-100 min-w-[1100px]">
              <div className="grid grid-cols-[44px_120px_130px_200px_120px_140px_110px_100px_120px] gap-3 px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div />
                <div>用户名</div>
                <div>姓名</div>
                <div>邮箱</div>
                <div>部门</div>
                <div>角色</div>
                <div className="text-center">负责待办</div>
                <div className="text-center">状态</div>
                <div className="text-right pr-2">操作</div>
              </div>

              {users.map((u) => {
                const roleCfg = ROLE_LABEL[u.role];
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[44px_120px_130px_200px_120px_140px_110px_100px_120px] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors text-sm relative"
                  >
                    <div className="flex items-center">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent text-white text-sm font-bold flex items-center justify-center shadow-soft">
                        {u.name.slice(0, 1)}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-slate-700 truncate">
                      {u.username}
                    </div>
                    <div className="font-medium text-slate-800 truncate">
                      {u.name}
                    </div>
                    <div className="text-slate-600 truncate flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.department || '-'}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setRoleMenu(roleMenu === u.id ? null : u.id)
                        }
                        disabled={u.id === user?.id}
                        className={cn(
                          'badge !py-1 hover:shadow-soft transition-shadow',
                          roleCfg?.className,
                          u.id !== user?.id && 'cursor-pointer'
                        )}
                      >
                        <Shield className="w-3 h-3" />
                        {roleCfg?.label || u.role}
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>
                      {roleMenu === u.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setRoleMenu(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-hover z-20 py-1 overflow-hidden">
                            {ROLE_OPTIONS.map((r) => {
                              const cfg = ROLE_LABEL[r];
                              const active = u.role === r;
                              return (
                                <button
                                  key={r}
                                  onClick={() => {
                                    updateRoleMutation.mutate({
                                      id: u.id,
                                      newRole: r,
                                    });
                                    setRoleMenu(null);
                                  }}
                                  className={cn(
                                    'w-full px-3.5 py-2 text-left text-sm flex items-center justify-between',
                                    active
                                      ? 'bg-primary/5 text-primary'
                                      : 'text-slate-600 hover:bg-slate-50'
                                  )}
                                >
                                  <span className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    {cfg?.label || r}
                                  </span>
                                  {active && (
                                    <Check className="w-4 h-4 text-primary" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-center font-mono tabular-nums font-semibold text-primary">
                      {u._count?.assignedTasks || 0}
                    </div>
                    <div className="flex items-center justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={u.active}
                          disabled={u.id === user?.id}
                          onChange={(e) =>
                            toggleActiveMutation.mutate({
                              id: u.id,
                              active: e.target.checked,
                            })
                          }
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary disabled:opacity-50 disabled:cursor-not-allowed" />
                      </label>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      <span
                        className={cn(
                          'badge !text-[11px]',
                          u.active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}
                      >
                        {u.active ? '启用' : '禁用'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          submitting={createUserMutation.isPending}
          onSubmit={createUserMutation.mutate}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  submitting,
  onSubmit,
}: {
  onClose: () => void;
  submitting: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!username.trim()) next.username = '请输入用户名';
    if (!password.trim()) next.password = '请输入密码';
    else if (password.length < 6) next.password = '密码至少 6 位';
    if (!name.trim()) next.name = '请输入姓名';
    if (!email.trim()) next.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = '邮箱格式不正确';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ username, password, name, email, department, role });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-xl shadow-hover animate-slide-in-right overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            新建用户
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost !p-1.5"
            disabled={submitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5 text-primary" />
                用户名 <span className="text-danger">*</span>
              </label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: '' });
                }}
                placeholder="登录账号"
                className={cn(
                  'input-base',
                  errors.username && '!border-danger'
                )}
                autoFocus
              />
              {errors.username && (
                <p className="text-xs text-danger mt-1">{errors.username}</p>
              )}
            </div>
            <div>
              <label className="label-base flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-primary" />
                密码 <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="至少 6 位"
                className={cn(
                  'input-base',
                  errors.password && '!border-danger'
                )}
              />
              {errors.password && (
                <p className="text-xs text-danger mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label-base">
              姓名 <span className="text-danger">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="真实姓名"
              className={cn('input-base', errors.name && '!border-danger')}
            />
            {errors.name && (
              <p className="text-xs text-danger mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="label-base flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-primary" />
              邮箱 <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="example@company.com"
              className={cn('input-base', errors.email && '!border-danger')}
            />
            {errors.email && (
              <p className="text-xs text-danger mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                部门
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例如：技术部"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                角色
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="input-base appearance-none pr-8"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]?.label || r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider" />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary min-w-[110px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  确认创建
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
