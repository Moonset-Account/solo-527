'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, User as UserIcon, Mail, Shield, Check, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Badge } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/FilterBar';
import { roleLabel, formatDate, cn, uid } from '@/lib/utils';
import type { UserRole, UserProfile } from '@/lib/types';

const schema = z.object({
  full_name: z.string().min(1, '请输入姓名').max(50, '姓名过长'),
  email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
  role: z.enum(['store_manager', 'warehouse', 'inspector', 'team_lead', 'reception']),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function UsersPage() {
  const users = useAppStore((s) => s.users);
  const setUsers = useAppStore((s) => (state: { users: UserProfile[] }) => {
    useAppStore.setState(state);
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'reception',
      is_active: true,
    },
  });

  const openAddModal = () => {
    setEditingUser(null);
    reset({
      full_name: '',
      email: '',
      role: 'reception',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setValue('full_name', user.full_name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('is_active', user.is_active);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 300));

    if (editingUser) {
      useAppStore.setState((s) => ({
        users: s.users.map((u) =>
          u.id === editingUser.id ? { ...u, ...data } : u,
        ),
      }));
    } else {
      const newUser: UserProfile = {
        id: uid('user'),
        ...data,
        created_at: new Date().toISOString(),
      };
      useAppStore.setState((s) => ({
        users: [newUser, ...s.users],
      }));
    }

    setModalOpen(false);
  };

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
        actions={
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增用户
          </button>
        }
      />

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
          {
            key: 'actions',
            header: '操作',
            className: 'text-right',
            render: (r: UserProfile) => (
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(r);
                  }}
                  className="btn-ghost !px-2 !py-1"
                >
                  <Pencil className="w-4 h-4" />
                  编辑
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? '编辑用户' : '新增用户'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label">
              <UserIcon className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入姓名"
              className={cn(
                'input',
                errors.full_name && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              )}
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="label">
              <Mail className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="请输入邮箱地址"
              className={cn(
                'input',
                errors.email && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">
              <Shield className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              角色 <span className="text-red-500">*</span>
            </label>
            <Select
              className={cn(
                errors.role && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              )}
              {...register('role')}
            >
              <option value="store_manager">{roleLabel.store_manager}</option>
              <option value="warehouse">{roleLabel.warehouse}</option>
              <option value="inspector">{roleLabel.inspector}</option>
              <option value="team_lead">{roleLabel.team_lead}</option>
              <option value="reception">{roleLabel.reception}</option>
            </Select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="label">
              <Check className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              账号状态
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...register('is_active')}
              />
              <span className="text-sm text-slate-700">启用账号</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
