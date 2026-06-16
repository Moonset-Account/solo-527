'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { DECORATION_STYLES, LEAD_SOURCES } from '@/lib/constants';
import { useForm } from 'react-hook-form';

export function Topbar() {
  const { createLead, stages, tags, currentUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, reset } = useForm();

  const pageTitle: Record<string, string> = {
    '/': '工作台',
    '/pipeline': '线索管道',
    '/pipeline/list': '线索列表',
    '/pool': '公海池',
    '/analytics/prediction': '成交预测看板',
    '/analytics/revisit': '回访频次报表',
    '/settings/stages': '跟进阶段设置',
    '/settings/tags': '客户标签管理',
    '/settings/rules': '校验规则设置',
    '/settings/attachments': '合同附件模板',
    '/admin/users': '用户管理',
    '/admin/roles': '角色权限管理',
  };

  const title = Object.entries(pageTitle).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] || '';

  const onSubmit = (data: any) => {
    createLead({
      customer_name: data.customer_name,
      phone: data.phone,
      community: data.community,
      area: data.area ? parseFloat(data.area) : undefined,
      budget_min: data.budget_min ? parseFloat(data.budget_min) * 10000 : undefined,
      budget_max: data.budget_max ? parseFloat(data.budget_max) * 10000 : undefined,
      style: data.style,
      source: data.source,
      remark: data.remark,
      tags: data.tags || [],
    });
    reset();
    setOpen(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Input
            variant="search"
            placeholder="搜索客户姓名、电话、小区..."
            className="w-72"
          />
          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            新建线索
          </Button>
        </div>
      </header>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建线索"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSubmit(onSubmit)}>创建线索</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
              <input
                {...register('customer_name', { required: true })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="请输入客户姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
              <input
                {...register('phone', { required: true })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="请输入手机号码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在小区</label>
              <input
                {...register('community')}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="请输入小区名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">房屋面积 (㎡)</label>
              <input
                {...register('area')}
                type="number"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="请输入面积"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预算 (万元)</label>
              <div className="flex items-center gap-2">
                <input
                  {...register('budget_min')}
                  type="number"
                  className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                  placeholder="最小"
                />
                <span className="text-gray-400">至</span>
                <input
                  {...register('budget_max')}
                  type="number"
                  className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                  placeholder="最大"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">装修风格</label>
              <Select
                options={DECORATION_STYLES.map((s) => ({ value: s, label: s }))}
                onChange={(v) => setValue('style', v)}
                placeholder="请选择风格"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来源渠道</label>
              <Select
                options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
                onChange={(v) => setValue('source', v)}
                placeholder="请选择渠道"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <label
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: t.color + '40', color: t.color }}
                >
                  <input
                    type="checkbox"
                    value={t.id}
                    onChange={(e) => {
                      const current = (register('tags') as any).value || [];
                      if (e.target.checked) {
                        setValue('tags', [...current, t.id]);
                      } else {
                        setValue('tags', current.filter((x: string) => x !== t.id));
                      }
                    }}
                    className="accent-primary-500"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              {...register('remark')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm resize-none"
              placeholder="补充说明"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
