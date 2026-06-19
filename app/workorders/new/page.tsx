'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

const schema = z.object({
  vehicle_id: z.string().min(1, '请选择关联车辆'),
  title: z.string().min(2, '工单标题至少2个字符').max(100, '工单标题不超过100个字符'),
  description: z.string().min(5, '工单描述至少5个字符'),
  team_id: z.string().optional(),
  assignee_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewWorkOrderPage() {
  const router = useRouter();
  const vehicles = useAppStore((s) => s.vehicles);
  const users = useAppStore((s) => s.users);
  const addWorkOrder = useAppStore((s) => s.addWorkOrder);

  const teamUsers = users.filter((u) => u.role === 'team_lead');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_id: '',
      title: '',
      description: '',
      team_id: '',
      assignee_id: '',
    },
  });

  const onSubmit = (data: FormData) => {
    const wo = addWorkOrder({
      vehicle_id: data.vehicle_id,
      title: data.title,
      description: data.description,
      team_id: data.team_id || undefined,
      assignee_id: data.assignee_id || undefined,
      status: data.assignee_id ? 'assigned' : 'pending',
    });
    router.push(`/workorders/${wo.id}`);
  };

  const inputClass = (hasError?: boolean) =>
    cn('input', hasError && 'border-red-400 focus:ring-red-200 focus:border-red-400');

  return (
    <div>
      <PageHeader
        title="新增维修工单"
        description="创建新的维修工单，关联车辆并指派负责人。"
        backHref="/workorders"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            关联车辆 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('vehicle_id')}
            className={inputClass(!!errors.vehicle_id)}
            onChange={(e) => setValue('vehicle_id', e.target.value, { shouldValidate: true })}
          >
            <option value="">请选择车辆</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} - {v.brand} {v.model} ({v.owner_name})
              </option>
            ))}
          </select>
          {errors.vehicle_id && (
            <p className="mt-1 text-sm text-red-500">{errors.vehicle_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            工单标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="例如：帕萨特常规保养"
            {...register('title')}
            className={inputClass(!!errors.title)}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            工单描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="详细描述维修需求、故障现象、客户诉求等"
            {...register('description')}
            className={cn(inputClass(!!errors.description), 'resize-none')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              指派班组
            </label>
            <select
              {...register('team_id')}
              className={inputClass()}
              onChange={(e) => setValue('team_id', e.target.value)}
            >
              <option value="">请选择班组</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              指派负责人
            </label>
            <select
              {...register('assignee_id')}
              className={inputClass()}
              onChange={(e) => setValue('assignee_id', e.target.value)}
            >
              <option value="">请选择负责人</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/workorders')}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            创建工单
          </button>
        </div>
      </form>
    </div>
  );
}
