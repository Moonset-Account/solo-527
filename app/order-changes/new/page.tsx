'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus, Trash2, Car, Package, Wrench } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import type { AffectedObject } from '@/lib/types';

const CHANGE_TYPES = ['配件变更', '项目追加', '项目取消', '价格调整', '车辆更换', '责任人变更', '其他'];

const schema = z.object({
  workorder_id: z.string().optional(),
  change_type: z.string().min(1, '请选择变更类型'),
  content: z.string().min(5, '变更内容至少5个字符').max(1000, '变更内容不超过1000个字符'),
  affected_objects: z
    .array(
      z.object({
        type: z.enum(['vehicle', 'part', 'workorder']),
        id: z.string().min(1, '请输入对象ID'),
        name: z.string().min(1, '请输入对象名称'),
      }),
    )
    .min(1, '请至少添加一个影响对象'),
  responsible_id: z.string().min(1, '请选择责任人'),
});

type FormData = z.infer<typeof schema>;

const AFFECTED_TYPE_OPTIONS: { value: AffectedObject['type']; label: string; icon: typeof Car }[] = [
  { value: 'vehicle', label: '车辆', icon: Car },
  { value: 'part', label: '配件', icon: Package },
  { value: 'workorder', label: '工单', icon: Wrench },
];

export default function NewOrderChangePage() {
  const router = useRouter();
  const users = useAppStore((s) => s.users);
  const workOrders = useAppStore((s) => s.workOrders);
  const vehicles = useAppStore((s) => s.vehicles);
  const parts = useAppStore((s) => s.parts);
  const addOrderChange = useAppStore((s) => s.addOrderChange);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workorder_id: '',
      change_type: '',
      content: '',
      affected_objects: [{ type: 'workorder', id: '', name: '' }],
      responsible_id: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'affected_objects',
  });

  const affectedObjects = watch('affected_objects');

  const handleAutoFill = (index: number, type: AffectedObject['type'], id: string) => {
    if (!id) return;
    let name = '';
    if (type === 'vehicle') {
      name = vehicles.find((v) => v.id === id)?.plate_number ?? '';
    } else if (type === 'part') {
      name = parts.find((p) => p.id === id)?.name ?? '';
    } else if (type === 'workorder') {
      name = workOrders.find((w) => w.id === id)?.title ?? '';
    }
    if (name) {
      setValue(`affected_objects.${index}.name`, name, { shouldValidate: true });
    }
  };

  const onSubmit = (data: FormData) => {
    addOrderChange({
      workorder_id: data.workorder_id || undefined,
      change_type: data.change_type,
      content: data.content,
      affected_objects: data.affected_objects,
      responsible_id: data.responsible_id,
      status: 'open',
    });
    router.push('/order-changes');
  };

  const inputClass = (hasError?: boolean) =>
    cn('input', hasError && 'border-red-400 focus:ring-red-200 focus:border-red-400');

  return (
    <div>
      <PageHeader
        title="新增订单变更"
        description="记录工单执行过程中的变更，关联影响对象并指派处理责任人。"
        backHref="/order-changes"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 max-w-3xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            关联工单（可选）
          </label>
          <select
            {...register('workorder_id')}
            className={inputClass()}
            onChange={(e) => setValue('workorder_id', e.target.value)}
          >
            <option value="">不关联具体工单</option>
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>
                [{w.vehicle_plate}] {w.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            变更类型 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('change_type')}
            className={inputClass(!!errors.change_type)}
            onChange={(e) => setValue('change_type', e.target.value, { shouldValidate: true })}
          >
            <option value="">请选择变更类型</option>
            {CHANGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.change_type && (
            <p className="mt-1 text-sm text-red-500">{errors.change_type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            变更内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="详细描述变更原因、具体内容、影响范围等"
            {...register('content')}
            className={cn(inputClass(!!errors.content), 'resize-none')}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              影响对象 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => append({ type: 'workorder', id: '', name: '' })}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              添加对象
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const objType = affectedObjects[index]?.type ?? 'workorder';
              const TypeIcon = AFFECTED_TYPE_OPTIONS.find((o) => o.value === objType)?.icon ?? Wrench;
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_auto] gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <select
                      {...register(`affected_objects.${index}.type`)}
                      className={inputClass(!!errors.affected_objects?.[index]?.type)}
                      onChange={(e) => {
                        const newType = e.target.value as AffectedObject['type'];
                        setValue(`affected_objects.${index}.type`, newType);
                        setValue(`affected_objects.${index}.id`, '');
                        setValue(`affected_objects.${index}.name`, '');
                      }}
                    >
                      {AFFECTED_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex gap-2">
                      <select
                        className={inputClass(!!errors.affected_objects?.[index]?.id)}
                        value={affectedObjects[index]?.id ?? ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          setValue(`affected_objects.${index}.id`, id, { shouldValidate: true });
                          handleAutoFill(index, objType, id);
                        }}
                      >
                        <option value="">请选择{objType === 'vehicle' ? '车辆' : objType === 'part' ? '配件' : '工单'}</option>
                        {objType === 'vehicle' &&
                          vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.plate_number} - {v.brand} {v.model}
                            </option>
                          ))}
                        {objType === 'part' &&
                          parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.part_code} - {p.name}
                            </option>
                          ))}
                        {objType === 'workorder' &&
                          workOrders.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.title}
                            </option>
                          ))}
                      </select>
                    </div>
                    {errors.affected_objects?.[index]?.id && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.affected_objects[index]?.id?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="对象名称"
                      {...register(`affected_objects.${index}.name`)}
                      className={inputClass(!!errors.affected_objects?.[index]?.name)}
                    />
                    {errors.affected_objects?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.affected_objects[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (fields.length > 1) remove(index);
                    }}
                    disabled={fields.length <= 1}
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-lg border transition',
                      fields.length > 1
                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                        : 'border-slate-200 text-slate-300 cursor-not-allowed',
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {errors.affected_objects && !Array.isArray(errors.affected_objects) && (
            <p className="mt-2 text-sm text-red-500">{errors.affected_objects.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            责任人 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('responsible_id')}
            className={inputClass(!!errors.responsible_id)}
            onChange={(e) => setValue('responsible_id', e.target.value, { shouldValidate: true })}
          >
            <option value="">请选择责任人</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          {errors.responsible_id && (
            <p className="mt-1 text-sm text-red-500">{errors.responsible_id.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/order-changes')}
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
            提交变更
          </button>
        </div>
      </form>
    </div>
  );
}
