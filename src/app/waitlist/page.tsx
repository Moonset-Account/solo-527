'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/hooks/use-trpc';
import { AdjustModal } from '@/components/waitlist/adjust-modal';
import { calculateWaitDays, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, Loader2 } from 'lucide-react';

type WaitlistItem = {
  id: string;
  studentId: string;
  studentName: string;
  isMinor: false;
  courseId: string;
  courseName: string;
  campusId: string;
  campusName: string;
  originalEnrollTime: string;
  convertedTime: string | null;
  waitDays: number | null;
  position: number;
  status: string;
  channel: string;
  ageGroup: string;
};

type MinorAggregate = {
  ageGroup: string;
  status: string;
  count: number;
};

type WaitlistResponse = {
  adults: WaitlistItem[];
  minorAggregates: MinorAggregate[];
};

type AdjustLog = {
  id: string;
  entryId: string;
  oldPosition: number;
  newPosition: number;
  reason: string;
  operator: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  waiting: { label: '等待中', className: 'bg-blue-100 text-blue-700' },
  converted: { label: '已转正', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adjustEntry, setAdjustEntry] = useState<WaitlistItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ['meta.courses'],
    queryFn: () => trpc.meta.courses.query(),
  });

  const effectiveCourseId = selectedCourse || (courses?.[0]?.id ?? '');

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['waitlist.list', effectiveCourseId],
    queryFn: () => trpc.waitlist.list.query({ courseId: effectiveCourseId }),
    enabled: !!effectiveCourseId,
  });

  const { data: adjustLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['waitlist.history', effectiveCourseId],
    queryFn: () => trpc.waitlist.history.query({ courseId: effectiveCourseId }),
    enabled: !!effectiveCourseId,
  });

  const adjustMutation = useMutation({
    mutationFn: (params: { entryId: string; newPosition: number; reason: string }) =>
      trpc.waitlist.adjust.mutate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist.list', effectiveCourseId] });
      queryClient.invalidateQueries({ queryKey: ['waitlist.history', effectiveCourseId] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (params: { entryId: string }) =>
      trpc.waitlist.convert.mutate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist.list', effectiveCourseId] });
    },
  });

  const handleAdjust = (entryId: string, newPosition: number, reason: string) => {
    adjustMutation.mutate({ entryId, newPosition, reason });
  };

  const handleConvert = (entryId: string) => {
    if (window.confirm('确认将该候补学员转正？')) {
      convertMutation.mutate({ entryId });
    }
  };

  const openAdjustModal = (entry: WaitlistItem) => {
    setAdjustEntry(entry);
    setModalOpen(true);
  };

  const selectedCourseName = courses?.find((c) => c.id === effectiveCourseId)?.name ?? '';

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">候补管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理课程候补队列，调整顺序与转正操作</p>
        </div>

        <div className="mb-6 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {selectedCourseName}
            <ChevronDown className="h-4 w-4" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {(courses ?? []).map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    'block w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                    effectiveCourseId === course.id && 'bg-[#E8A838]/10 font-medium text-[#E8A838]'
                  )}
                >
                  {course.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {entriesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">排位</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">学生姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">年龄段</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">渠道</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">原报名时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">等待天数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {((entries as WaitlistResponse | undefined)?.adults ?? []).map((entry) => {
                  const waitDays = entry.waitDays ?? calculateWaitDays(new Date(entry.originalEnrollTime), entry.convertedTime ? new Date(entry.convertedTime) : undefined);
                  const badge = STATUS_BADGE[entry.status] ?? STATUS_BADGE.waiting;
                  return (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{entry.position}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.ageGroup}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.channel}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(entry.originalEnrollTime), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            waitDays > 14 && 'text-red-500',
                            waitDays > 7 && waitDays <= 14 && 'text-orange-500',
                            waitDays <= 7 && 'text-gray-700'
                          )}
                        >
                          {waitDays} 天
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', badge.className)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.status === 'waiting' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openAdjustModal(entry)}
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              调整顺序
                            </button>
                            <button
                              onClick={() => handleConvert(entry.id)}
                              className="rounded-md bg-[#27AE60] px-2 py-1 text-xs text-white hover:bg-[#219a52]"
                            >
                              转正
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {((entries as WaitlistResponse | undefined)?.minorAggregates ?? []).length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">未成年人候补（聚合展示，不显示个人信息）</p>
            <div className="flex flex-wrap gap-3">
              {((entries as WaitlistResponse | undefined)?.minorAggregates ?? []).map((agg) => (
                <span key={`${agg.ageGroup}-${agg.status}`} className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {agg.ageGroup} · {STATUS_BADGE[agg.status]?.label ?? agg.status} · {agg.count}人
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">调序记录</h2>
          {logsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          ) : (adjustLogs as AdjustLog[] | undefined)?.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">暂无调序记录</p>
          ) : (
            <div className="space-y-0">
              {(adjustLogs as AdjustLog[] | undefined)?.map((log, idx) => (
                <div key={log.id} className="flex gap-4 relative pb-6">
                  {idx < ((adjustLogs as AdjustLog[])?.length ?? 0) - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                  )}
                  <div className="relative mt-1 h-6 w-6 flex-shrink-0 rounded-full bg-[#E8A838]/20 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#E8A838]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">{log.operator}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">
                        第 {log.oldPosition} 位 → 第 {log.newPosition} 位
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{log.reason}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdjustModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAdjustEntry(null);
        }}
        entry={adjustEntry ? { id: adjustEntry.id, position: adjustEntry.position, studentName: adjustEntry.studentName } : { id: '', position: 0, studentName: '' }}
        onConfirm={handleAdjust}
      />
    </div>
  );
}
