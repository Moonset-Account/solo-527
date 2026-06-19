'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CarFront,
  Save,
  X as XIcon,
  Hash,
  User,
  Phone,
  CreditCard,
  Car,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

const schema = z.object({
  plate_number: z
    .string()
    .min(1, '请输入车牌号')
    .regex(
      /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}$/,
      '车牌号格式不正确，例如：京A·12345',
    ),
  brand: z.string().min(1, '请输入品牌').max(50, '品牌名称过长'),
  model: z.string().min(1, '请输入车型').max(100, '车型名称过长'),
  vin: z
    .string()
    .min(17, 'VIN码必须为17位')
    .max(17, 'VIN码必须为17位')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN码格式不正确，应为17位字母数字组合（不含I、O、Q）'),
  owner_name: z.string().min(1, '请输入车主姓名').max(50, '车主姓名过长'),
  owner_phone: z
    .string()
    .min(1, '请输入车主电话')
    .regex(/^1[3-9]\d{9}$/, '请输入正确的11位手机号码'),
});

type FormValues = z.infer<typeof schema>;

export default function NewVehiclePage() {
  const router = useRouter();
  const addVehicle = useAppStore((s) => s.addVehicle);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plate_number: '',
      brand: '',
      model: '',
      vin: '',
      owner_name: '',
      owner_phone: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 300));
    const v = addVehicle(data);
    router.push(`/vehicles/${v.id}`);
  };

  return (
    <div>
      <PageHeader
        title="登记车辆"
        description="录入新车辆信息，建立车辆档案。"
        backHref="/vehicles"
        actions={
          <button
            type="button"
            onClick={() => router.push('/vehicles')}
            className="btn-ghost"
          >
            <XIcon className="w-4 h-4" />
            取消
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in-up">
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
              <CarFront className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">车辆基本信息</div>
              <div className="text-xs text-slate-500">请准确填写车辆及车主信息</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">
                <Hash className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                车牌号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例如：京A·12345"
                className={cn(
                  'input uppercase',
                  errors.plate_number && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                {...register('plate_number')}
              />
              {errors.plate_number && (
                <p className="mt-1 text-xs text-red-500">{errors.plate_number.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                <Car className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                品牌 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例如：大众、丰田、奔驰"
                className={cn(
                  'input',
                  errors.brand && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                {...register('brand')}
              />
              {errors.brand && (
                <p className="mt-1 text-xs text-red-500">{errors.brand.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="label">
                <Car className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                车型 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例如：帕萨特 2023款 330TSI"
                className={cn(
                  'input',
                  errors.model && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                {...register('model')}
              />
              {errors.model && (
                <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="label">
                <CreditCard className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                VIN码（车辆识别代号） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="17位车辆识别代号"
                className={cn(
                  'input font-mono uppercase',
                  errors.vin && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                maxLength={17}
                {...register('vin')}
              />
              {errors.vin && (
                <p className="mt-1 text-xs text-red-500">{errors.vin.message}</p>
              )}
            </div>

            <div className="pt-4 sm:col-span-2 border-t border-slate-100" />

            <div>
              <label className="label">
                <User className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                车主姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="请输入车主姓名"
                className={cn(
                  'input',
                  errors.owner_name && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                {...register('owner_name')}
              />
              {errors.owner_name && (
                <p className="mt-1 text-xs text-red-500">{errors.owner_name.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                <Phone className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                车主电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="11位手机号码"
                maxLength={11}
                className={cn(
                  'input',
                  errors.owner_phone && 'border-red-400 focus:border-red-500 focus:ring-red-200',
                )}
                {...register('owner_phone')}
              />
              {errors.owner_phone && (
                <p className="mt-1 text-xs text-red-500">{errors.owner_phone.message}</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => router.push('/vehicles')}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Save className="w-4 h-4" />
              {isSubmitting ? '保存中...' : '保存登记'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
