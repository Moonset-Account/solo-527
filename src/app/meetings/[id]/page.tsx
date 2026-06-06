'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    location: string;
  };
  host: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
  };
  visitors: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    tokens?: Array<{
      id: string;
      qrCodeData: string;
      expiresAt: string;
    }>;
  }>;
}

const visitorStatusMap: Record<string, { label: string; class: string }> = {
  INVITED: { label: '已邀请', class: 'badge-info' },
  CHECKED_IN: { label: '已入场', class: 'badge-success' },
  CHECKED_OUT: { label: '已离场', class: 'badge-secondary' },
  CANCELLED: { label: '已取消', class: 'badge-danger' },
};

const meetingStatusMap: Record<string, { label: string; class: string }> = {
  SCHEDULED: { label: '已预约', class: 'badge-info' },
  IN_PROGRESS: { label: '进行中', class: 'badge-success' },
  COMPLETED: { label: '已完成', class: 'badge-secondary' },
  CANCELLED: { label: '已取消', class: 'badge-danger' },
  RESCHEDULED: { label: '已改期', class: 'badge-warning' },
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  useEffect(() => {
    loadMeeting();
  }, [params.id]);

  async function loadMeeting() {
    try {
      const res = await fetch(`/api/meetings`);
      const data = await res.json();
      const found = (data.meetings || []).find((m: any) => m.id === params.id);
      if (found) {
        const visitorsWithTokens = await Promise.all(
          found.visitors.map(async (v: any) => {
            try {
              const tokenRes = await fetch(`/api/token?visitorId=${v.id}`);
              const tokenData = await tokenRes.json();
              return { ...v, tokens: tokenData.token ? [tokenData.token] : [] };
            } catch {
              return { ...v, tokens: [] };
            }
          })
        );
        setMeeting({ ...found, visitors: visitorsWithTokens });
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelMeeting() {
    if (!confirm('确定要取消此会议吗？所有访客邀请和门禁权限将被撤销。')) {
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkedInVisitorCount > 0) {
          alert(`会议已取消。有 ${data.checkedInVisitorCount} 位访客已入场，已通知前台处理。`);
        } else {
          alert('会议已取消，所有访客邀请和门禁权限已撤销。');
        }
        router.push('/meetings');
      }
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
      alert('取消会议失败');
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">会议不存在</p>
        <Link href="/meetings" className="text-primary-600 hover:underline mt-2 inline-block">
          返回会议列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/meetings" className="text-gray-600 hover:text-gray-900 mr-4">
            ← 返回
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-gray-600 mt-1">
              会议详情
              <span className={`ml-3 badge ${meetingStatusMap[meeting.status]?.class}`}>
                {meetingStatusMap[meeting.status]?.label}
              </span>
            </p>
          </div>
        </div>
        {meeting.status === 'SCHEDULED' && (
          <div className="flex space-x-3">
            <Link href={`/meetings/${meeting.id}/edit`} className="btn btn-secondary">
              编辑会议
            </Link>
            <button onClick={handleCancelMeeting} className="btn btn-danger">
              取消会议
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">会议信息</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">会议室</p>
                <p className="font-medium mt-1">
                  {meeting.room ? `${meeting.room.name} (${meeting.room.location})` : '未指定'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">所属部门</p>
                <p className="font-medium mt-1">{meeting.department.name}</p>
              </div>
              <div>
                <p className="text-gray-500">开始时间</p>
                <p className="font-medium mt-1">
                  {format(new Date(meeting.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">结束时间</p>
                <p className="font-medium mt-1">
                  {format(new Date(meeting.endTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">主持人</p>
                <p className="font-medium mt-1">
                  {meeting.host.name} ({meeting.host.email})
                </p>
              </div>
            </div>
            {meeting.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-sm">会议描述</p>
                <p className="mt-1">{meeting.description}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">访客列表 ({meeting.visitors.length}人)</h2>
            {meeting.visitors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无访客</p>
            ) : (
              <div className="space-y-3">
                {meeting.visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedVisitor(visitor)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {visitor.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{visitor.name}</p>
                        <p className="text-sm text-gray-500">{visitor.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`badge ${visitorStatusMap[visitor.status]?.class}`}>
                        {visitorStatusMap[visitor.status]?.label}
                      </span>
                      {visitor.tokens && visitor.tokens.length > 0 && (
                        <span className="text-green-600 text-sm">📱 二维码已生成</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">操作说明</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-primary-500 mr-2">1.</span>
                <p>访客会收到包含二维码的短信邀请</p>
              </div>
              <div className="flex items-start">
                <span className="text-primary-500 mr-2">2.</span>
                <p>访客到场后前台核验证件并拍照</p>
              </div>
              <div className="flex items-start">
                <span className="text-primary-500 mr-2">3.</span>
                <p>门禁权限在会议开始前30分钟生效</p>
              </div>
              <div className="flex items-start">
                <span className="text-primary-500 mr-2">4.</span>
                <p>访客离场后权限自动撤销，照片72小时后删除</p>
              </div>
              <div className="flex items-start">
                <span className="text-primary-500 mr-2">5.</span>
                <p>会议取消/改期会自动更新访客二维码</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ 注意事项</h2>
            <p className="text-sm text-yellow-700">
              如会议改期或更换会议室，系统会自动更新访客二维码。
              如果访客已入场，系统会创建前台待办任务通知工作人员处理。
            </p>
          </div>
        </div>
      </div>

      {selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">访客二维码</h3>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">{selectedVisitor.name}</p>
              <p className="text-sm text-gray-500 mb-4">{selectedVisitor.phone}</p>
              {selectedVisitor.tokens && selectedVisitor.tokens.length > 0 ? (
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <img
                    src={selectedVisitor.tokens[0].qrCodeData}
                    alt="访客二维码"
                    className="w-48 h-48"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    有效期至: {format(new Date(selectedVisitor.tokens[0].expiresAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 py-8">暂无有效的二维码</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
