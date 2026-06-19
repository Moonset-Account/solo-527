'use client';

import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';

const partSchema = z.object({
  part_code: z.string().min(1, '配件编号不能为空'),
  name: z.string().min(1, '配件名称不能为空'),
  category: z.string().min(1, '分类不能为空'),
  stock: z.coerce.number().min(0, '初始库存不能为负数'),
  unit_price: z.coerce.number().min(0, '单价不能为负数'),
  unit: z.string().min(1, '单位不能为空'),
  min_stock: z.coerce.number().min(0, '最低库存不能为负数'),
});

type PartFormValues = z.infer<typeof partSchema>;

const CATEGORY_OPTIONS = [
  '润滑油',
  '滤清器',
  '制动系统',
  '轮胎',
  '电气',
  '点火系统',
  '冷却系统',
  '悬挂系统',
  '转向系统',
  '传动系统',
  '车身配件',
  '其他',
];

const UNIT_OPTIONS = ['个', '件', '套', '桶', '瓶', '条', '副', '支', '箱', '米'];

export default function NewPartPage() {
  const router = useRouter();
  const addPart = useAppStore((s) => s.addPart);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      part_code: '',
      name: '',
      category: '',
      stock: 0,
      unit_price: 0,
      unit: '',
      min_stock: 0,
    },
  });

  const onSubmit = (values: PartFormValues) => {
    addPart({
      part_code: values.part_code,
      name: values.name,
      category: values.category,
      stock: values.stock,
      unit_price: values.unit_price,
      unit: values.unit,
      min_stock: values.min_stock,
    });
    router.push('/parts');
  };

  return (
    <div>
      <PageHeader
        title="新增配件"
        description="填写配件信息，创建新的库存配件记录。"
        backHref="/parts"
      />

      <div className="card p-6 max-w-2xl animate-fade-in-up">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">
                配件编号 <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="例如：P-OIL-001"
                {...register('part_code')}
              />
              {errors.part_code && (
                <p className="text-xs text-red-500 mt-1">{errors.part_code.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                配件名称 <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="例如：全合成机油 5W-30 4L"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                分类 <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('category')}>
                <option value="">请选择分类</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                单位 <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('unit')}>
                <option value="">请选择单位</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                初始库存 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="0"
                {...register('stock')}
              />
              {errors.stock && (
                <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                单价（元） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder="0.00"
                {...register('unit_price')}
              />
              {errors.unit_price && (
                <p className="text-xs text-red-500 mt-1">{errors.unit_price.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">
                最低库存 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="库存低于该值将触发预警"
                {...register('min_stock')}
              />
              {errors.min_stock && (
                <p className="text-xs text-red-500 mt-1">{errors.min_stock.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Package className="w-4 h-4" />
              保存配件
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
