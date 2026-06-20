'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Check, X } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Badge } from '@/components/DataTable';
import { roleLabel, formatDate, cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiGet<UserProfile[]>('/api/users');
        setUsers(data);
      } catch (e) {
        console.error('Failed to load users', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const avatarColor = (name: string) => {
    const colors = [
      'from-brand-500 to-brand-700',
      'from-emerald-500 to-emerald-700',
      'from-amber-500 to-amber-700',
      'from-purple-500 to-purple-700',
      'from-rose-500 to-rose-700',
      'from-cyan-500 to-cyan-700',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const initials = (name: string) => {
    return name.slice(-2);
  };

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="管理门店系统用户、角色及账号状态。"
      />

      {loading ? (
        <div className="text-center py-20 text-slate-500">加载中...</div>
      ) : (
        <DataTable
          data={users}
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'user',
              header: '用户',
              render: (r: UserProfile) => (
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold',
                      avatarColor(r.full_name),
                    )}
                  >
                    {initials(r.full_name)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{r.full_name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {r.email}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'role',
              header: '角色',
              render: (r: UserProfile) => (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <Badge className="bg-brand-50 text-brand-700">{roleLabel[r.role]}</Badge>
                </div>
              ),
            },
            {
              key: 'status',
              header: '状态',
              render: (r: UserProfile) =>
                r.is_active ? (
                  <Badge className="bg-emerald-50 text-emerald-700">
                    <Check className="w-3 h-3 mr-0.5" />
                    启用
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600">
                    <X className="w-3 h-3 mr-0.5" />
                    停用
                  </Badge>
                ),
            },
            {
              key: 'created_at',
              header: '创建时间',
              render: (r: UserProfile) => (
                <span className="text-sm text-slate-500">{formatDate(r.created_at)}</span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
