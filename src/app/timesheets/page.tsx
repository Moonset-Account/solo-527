'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Clock, Plus, Calendar as CalendarIcon, User, FolderKanban } from 'lucide-react';

interface Timesheet {
  id: string;
  hours: number;
  description: string | null;
  hourlyRate: number;
  workDate: string;
  createdAt: string;
  user: { name: string };
  project: { name: string };
  task: { title: string } | null;
}

export default function TimesheetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role === 'CLIENT') {
      router.push('/portal');
      return;
    }
    fetchTimesheets();
  }, [status, session]);

  const fetchTimesheets = async () => {
    try {
      const res = await fetch('/api/timesheets');
      const data = await res.json();
      if (data.success) setTimesheets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hours as any), 0);
  const totalAmount = timesheets.reduce(
    (sum, t) => sum + parseFloat(t.hours as any) * parseFloat(t.hourlyRate as any),
    0
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工时记录</h1>
            <p className="text-gray-500 mt-1">
              总计 {totalHours.toFixed(1)} 小时，价值 {formatCurrency(totalAmount)}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition">
            <Plus className="w-5 h-5" />
            记录工时
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月工时</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">涉及项目</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(timesheets.map((t) => t.project?.name)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">工时价值</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">日期</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">项目</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">任务</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">描述</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">人员</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-600">工时</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-600">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {formatDate(ts.workDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">{ts.project?.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{ts.task?.title || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                      {ts.description || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {ts.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{ts.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-gray-900">
                      {parseFloat(ts.hours as any).toFixed(1)}h
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-emerald-600">
                      {formatCurrency(parseFloat(ts.hours as any) * parseFloat(ts.hourlyRate as any))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {timesheets.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无工时记录</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
