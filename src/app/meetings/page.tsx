'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  room?: {
    id: string;
    name: string;
  };
  host: {
    id: string;
    name: string;
  };
  visitors: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

const statusMap: Record<string, { label: string; class: string }> = {
  SCHEDULED: { label: '已预约', class: 'badge-info' },
  IN_PROGRESS: { label: '进行中', class: 'badge-success' },
  COMPLETED: { label: '已完成', class: 'badge-secondary' },
  CANCELLED: { label: '已取消', class: 'badge-danger' },
  RESCHEDULED: { label: '已改期', class: 'badge-warning' },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelMeeting(id: string) {
    if (!confirm('确定要取消此会议吗？所有访客邀请和门禁权限将被撤销。')) {
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkedInVisitorCount > 0) {
          alert(`会议已取消。有 ${data.checkedInVisitorCount} 位访客已入场，已通知前台处理。`);
        } else {
          alert('会议已取消，所有访客邀请和门禁权限已撤销。');
        }
        loadMeetings();
      }
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
      alert('取消会议失败');
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会议管理</h1>
          <p className="text-gray-600 mt-1">查看和管理所有会议</p>
        </div>
        <Link href="/meetings/create" className="btn btn-primary">
          + 创建会议
        </Link>
      </div>

      <div className="card">
        {meetings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">暂无会议记录</p>
            <Link href="/meetings/create" className="text-primary-600 hover:underline mt-2 inline-block">
              创建第一个会议
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">会议主题</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">会议室</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">主持人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">访客</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{meeting.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {meeting.room ? meeting.room.name : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <p>{format(new Date(meeting.startTime), 'MM月dd日 HH:mm', { locale: zhCN })}</p>
                      <p className="text-gray-500">
                        至 {format(new Date(meeting.endTime), 'HH:mm', { locale: zhCN })}
                      </p>
                    </td>
                    <td className="py-3 px-4">{meeting.host.name}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info">{meeting.visitors.length} 人</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${statusMap[meeting.status]?.class || 'badge-secondary'}`}>
                        {statusMap[meeting.status]?.label || meeting.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/meetings/${meeting.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          详情
                        </Link>
                        {meeting.status === 'SCHEDULED' && (
                          <>
                            <Link
                              href={`/meetings/${meeting.id}/edit`}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              编辑
                            </Link>
                            <button
                              onClick={() => handleCancelMeeting(meeting.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              取消
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
