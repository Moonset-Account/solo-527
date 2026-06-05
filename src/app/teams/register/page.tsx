'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  User, 
  MapPin, 
  Phone, 
  Upload, 
  Plus, 
  Trash2, 
  Save,
  UserPlus,
  Calendar,
  Hash,
  IdCard
} from 'lucide-react';
import Link from 'next/link';

const PlayerSchema = z.object({
  name: z.string().min(2, '球员姓名至少2个字符'),
  idNumber: z.string().min(15, '身份证号格式不正确'),
  jerseyNumber: z.number().int().min(0).max(99, '球衣号码必须在0-99之间'),
  position: z.enum(['PG', 'SG', 'SF', 'PF', 'C']),
  dateOfBirth: z.string().optional(),
  avatar: z.string().optional(),
});

const TeamRegisterSchema = z.object({
  name: z.string().min(2, '队名至少2个字符'),
  city: z.string().min(2, '城市名称至少2个字符'),
  coach: z.string().min(2, '教练姓名至少2个字符'),
  contactName: z.string().min(2, '联系人姓名至少2个字符'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  logo: z.string().optional(),
  players: z.array(PlayerSchema).min(5, '至少需要5名球员'),
});

type TeamRegisterForm = z.infer<typeof TeamRegisterSchema>;

export default function TeamRegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamRegisterForm>({
    resolver: zodResolver(TeamRegisterSchema),
    defaultValues: {
      players: [
        { name: '', idNumber: '', jerseyNumber: 0, position: 'PG' },
        { name: '', idNumber: '', jerseyNumber: 0, position: 'SG' },
        { name: '', idNumber: '', jerseyNumber: 0, position: 'SF' },
        { name: '', idNumber: '', jerseyNumber: 0, position: 'PF' },
        { name: '', idNumber: '', jerseyNumber: 0, position: 'C' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'players',
  });

  const onSubmit = async (data: TeamRegisterForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          seasonId: 'default-season',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSubmitSuccess(true);
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addPlayer = () => {
    append({ name: '', idNumber: '', jerseyNumber: 0, position: 'PG' });
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">报名提交成功！</h2>
          <p className="text-text-secondary mb-6">
            您的球队报名信息已提交，我们将在1-3个工作日内完成审核。审核结果将通过短信通知您。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/teams"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              返回球队列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <Shield className="w-8 h-8 text-secondary" />
          球队报名
        </h1>
        <p className="text-text-secondary mt-1">
          填写球队信息和球员名单，提交后等待审核
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            球队信息
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                球队名称 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="请输入球队名称"
                {...register('name')}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                所在城市 <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="请输入城市"
                  {...register('city')}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              {errors.city && (
                <p className="mt-1 text-xs text-danger">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                主教练 <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="请输入教练姓名"
                  {...register('coach')}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              {errors.coach && (
                <p className="mt-1 text-xs text-danger">{errors.coach.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                联系人 <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="请输入联系人姓名"
                  {...register('contactName')}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              {errors.contactName && (
                <p className="mt-1 text-xs text-danger">{errors.contactName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                联系电话 <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="tel"
                  placeholder="请输入联系电话"
                  {...register('contactPhone')}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-danger">{errors.contactPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                球队Logo
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">点击上传Logo</p>
                <p className="text-xs text-text-muted mt-1">支持 JPG、PNG 格式</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              球员名单
              <span className="text-sm font-normal text-text-muted ml-2">
                (至少5名球员)
              </span>
            </h2>
            <button
              type="button"
              onClick={addPlayer}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              添加球员
            </button>
          </div>

          {errors.players && !Array.isArray(errors.players) && (
            <p className="mb-4 text-sm text-danger">{errors.players.message as string}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-border rounded-lg p-4 bg-background/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-text-primary">
                    球员 {index + 1}
                  </span>
                  {fields.length > 5 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      姓名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="球员姓名"
                      {...register(`players.${index}.name`)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                    {errors.players?.[index]?.name && (
                      <p className="mt-1 text-xs text-danger">
                        {errors.players[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      身份证号 <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="身份证号"
                        {...register(`players.${index}.idNumber`)}
                        className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                    {errors.players?.[index]?.idNumber && (
                      <p className="mt-1 text-xs text-danger">
                        {errors.players[index]?.idNumber?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      球衣号 <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="number"
                        min="0"
                        max="99"
                        placeholder="0"
                        {...register(`players.${index}.jerseyNumber`, { valueAsNumber: true })}
                        className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                    {errors.players?.[index]?.jerseyNumber && (
                      <p className="mt-1 text-xs text-danger">
                        {errors.players[index]?.jerseyNumber?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      位置 <span className="text-danger">*</span>
                    </label>
                    <select
                      {...register(`players.${index}.position`)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 appearance-none cursor-pointer"
                    >
                      <option value="PG">控球后卫 (PG)</option>
                      <option value="SG">得分后卫 (SG)</option>
                      <option value="SF">小前锋 (SF)</option>
                      <option value="PF">大前锋 (PF)</option>
                      <option value="C">中锋 (C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      出生日期
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="date"
                        {...register(`players.${index}.dateOfBirth`)}
                        className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      头像
                    </label>
                    <div className="border border-dashed border-border rounded-lg p-2 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 text-text-muted mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-6 z-10">
          <Link
            href="/teams"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? '提交中...' : '提交报名'}
          </button>
        </div>
      </form>
    </div>
  );
}
