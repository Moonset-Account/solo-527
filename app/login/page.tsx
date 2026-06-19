'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import { roleLabel } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = mockUsers.filter((u) => u.is_active);

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'manager@autoparts.com' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const ok = login(values.email);
    setLoading(false);
    if (ok) {
      const user = DEMO_ACCOUNTS.find((u) => u.email === values.email);
      if (user) {
        document.cookie = `demo_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_email=${encodeURIComponent(user.email)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_name=${encodeURIComponent(user.full_name)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_uid=${user.id}; path=/; max-age=86400; SameSite=Lax`;
      }
      router.push('/dashboard');
    } else {
      setError('未找到该用户，请检查邮箱或使用下方演示账号登录');
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand-200 blur-3xl" />
          <div className="absolute top-40 -right-10 w-96 h-96 rounded-full bg-accent-200 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-brand-100 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <CarFront className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-700 tracking-tight">
                汽配门店业务协同台
              </div>
              <div className="text-sm text-slate-500">Auto Parts Collaboration Platform</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 leading-tight mb-3">
            让门店协同更高效，
            <br />
            让数据驱动每一次决策。
          </h2>
          <p className="text-slate-500 leading-relaxed">
            覆盖车型登记、配件周转、维修生产、质检追溯、订单变更与回调监控的一站式管理平台。
          </p>

          <ul className="mt-8 space-y-3">
            {[
              '车型与配件全生命周期登记与查询',
              '配件周转明细可视化，无需导出 Excel',
              '班组排期与生产节点批量跟踪',
              '订单变更影响对象、责任人全链路留痕',
              '外部回调失败原因与补偿记录完整留存',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
              <CarFront className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-brand-700">汽配协同台</div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">登录您的账号</h1>
          <p className="text-sm text-slate-500 mb-6">
            输入邮箱登录协同管理台，体验门店全流程数字化。
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">
                <Mail className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                邮箱
              </label>
              <input
                type="email"
                className="input"
                placeholder="name@autoparts.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                <Lock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                演示密码
              </label>
              <div className="input bg-slate-50 text-slate-500 select-none">
                （演示环境无需密码，直接以邮箱身份登录）
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs text-slate-500 mb-3">快速体验 · 演示账号</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setValue('email', u.email)}
                  className="text-left p-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition text-xs"
                >
                  <div className="font-medium text-slate-800">{u.full_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {roleLabel[u.role]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
