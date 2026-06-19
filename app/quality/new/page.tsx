'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/DataTable';
import { cn, overallResultLabel, overallResultColor } from '@/lib/utils';
import type { OverallResult } from '@/lib/types';

const qualityItemSchema = z.object({
  name: z.string().min(1, '请输入质检项名称'),
  result: z.enum(['pass', 'fail']),
  issue: z.string().optional(),
  rectification: z.string().optional(),
});

const schema = z.object({
  workorder_id: z.string().min(1, '请选择关联工单'),
  overall_result: z.enum(['pass', 'fail', 'rework']),
  remark: z.string().optional(),
  items: z
    .array(qualityItemSchema)
    .min(1, '至少添加一项质检项'),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_ITEMS = [
  { name: '', result: 'pass' as const, issue: '', rectification: '' },
];

export default function NewQualityInspectionPage() {
  const router = useRouter();
  const workOrders = useAppStore((s) => s.workOrders);
  const currentUser = useAppStore((s) => s.currentUser);
  const addQualityInspection = useAppStore((s) => s.addQualityInspection);

  const availableWorkOrders = workOrders.filter(
    (wo) => wo.status === 'quality_check' || wo.status === 'in_progress',
  );

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
      overall_result: 'pass',
      remark: '',
      items: DEFAULT_ITEMS,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const onSubmit = (data: FormData) => {
    addQualityInspection({
      workorder_id: data.workorder_id,
      inspector_id: currentUser?.id ?? '',
      overall_result: data.overall_result,
      remark: data.remark || undefined,
      items: data.items.map((it) => ({
        name: it.name,
        result: it.result,
        issue: it.issue || undefined,
        rectification: it.rectification || undefined,
      })),
    });
    router.push('/quality');
  };

  const inputClass = (hasError?: boolean) =>
    cn('input', hasError && 'border-red-400 focus:ring-red-200 focus:border-red-400');

  const resultOptions: { value: OverallResult; label: string }[] = [
    { value: 'pass', label: '通过' },
    { value: 'rework', label: '需返工' },
    { value: 'fail', label: '不通过' },
  ];

  const watchedOverallResult = watch('overall_result');

  return (
    <div>
      <PageHeader
        title="新增质检记录"
        description="录入工单质检结果，系统将自动更新工单状态。"
        backHref="/quality"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 max-w-3xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              关联工单 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('workorder_id')}
              className={inputClass(!!errors.workorder_id)}
              onChange={(e) => setValue('workorder_id', e.target.value, { shouldValidate: true })}
            >
              <option value="">请选择工单（仅显示待质检或在修工单）</option>
              {availableWorkOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  [{wo.vehicle_plate}] {wo.title}
                </option>
              ))}
            </select>
            {errors.workorder_id && (
              <p className="mt-1 text-sm text-red-500">{errors.workorder_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              总体结果 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {resultOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex-1 cursor-pointer rounded-lg border-2 p-3 text-center transition-all',
                    watchedOverallResult === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('overall_result')}
                    className="sr-only"
                  />
                  <Badge className={overallResultColor[opt.value]}>{opt.label}</Badge>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-slate-800">质检项明细</div>
              <div className="text-xs text-slate-500 mt-0.5">
                至少添加 1 项质检内容，可动态增减
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                append({ name: '', result: 'pass', issue: '', rectification: '' })
              }
              className="btn-secondary inline-flex items-center gap-1.5 text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              添加质检项
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm font-medium text-slate-700">
                    质检项 #{index + 1}
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                      title="删除此项"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      质检项名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如：机油油位检查"
                      {...register(`items.${index}.name`)}
                      className={inputClass(!!errors.items?.[index]?.name)}
                    />
                    {errors.items?.[index]?.name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      结果
                    </label>
                    <select
                      {...register(`items.${index}.result`)}
                      className={inputClass()}
                      onChange={(e) =>
                        setValue(`items.${index}.result`, e.target.value as 'pass' | 'fail', {
                          shouldValidate: true,
                        })
                      }
                    >
                      <option value="pass">通过</option>
                      <option value="fail">不通过</option>
                    </select>
                  </div>
                </div>

                {watchedItems[index]?.result === 'fail' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        问题描述
                      </label>
                      <textarea
                        rows={2}
                        placeholder="描述存在的问题..."
                        {...register(`items.${index}.issue`)}
                        className={cn(inputClass(), 'resize-none')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        整改建议
                      </label>
                      <textarea
                        rows={2}
                        placeholder="给出整改建议..."
                        {...register(`items.${index}.rectification`)}
                        className={cn(inputClass(), 'resize-none')}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-sm text-red-500">{(errors.items as any).message}</p>
            )}
          </div>
        </div>

        <div className="card p-6 max-w-3xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <textarea
              rows={3}
              placeholder="质检总结或其他备注信息..."
              {...register('remark')}
              className={cn(inputClass(), 'resize-none')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/quality')}
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
              提交质检
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
