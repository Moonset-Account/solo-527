'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  roomId?: string;
  status: string;
}

interface MeetingForm {
  title: string;
  description?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
}

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MeetingForm>();

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    try {
      const [roomsRes, meetingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/meetings'),
      ]);

      const [roomsData, meetingsData] = await Promise.all([
        roomsRes.json(),
        meetingsRes.json(),
      ]);

      setRooms(roomsData.rooms || []);

      const found = (meetingsData.meetings || []).find((m: any) => m.id === params.id);
      if (found) {
        setMeeting(found);
        reset({
          title: found.title,
          description: found.description || '',
          roomId: found.roomId || '',
          startTime: new Date(found.startTime).toISOString().slice(0, 16),
          endTime: new Date(found.endTime).toISOString().slice(0, 16),
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: MeetingForm) {
    setSubmitting(true);
    try {
      const updateData: any = {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      };

      if (data.roomId) {
        updateData.roomId = data.roomId;
      }

      const res = await fetch(`/api/meetings/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const result = await res.json();
        alert('会议更新成功！访客二维码和门禁权限已同步更新。如有已入场访客，已通知前台处理。');
        router.push(`/meetings/${params.id}`);
      } else {
        const error = await res.json();
        alert(error.error || '更新会议失败');
      }
    } catch (error) {
      console.error('Failed to update meeting:', error);
      alert('更新会议失败');
    } finally {
      setSubmitting(false);
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

  if (meeting.status !== 'SCHEDULED') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card">
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">
              该会议状态为「{meeting.status}」，无法编辑
            </p>
            <Link href={`/meetings/${params.id}`} className="btn btn-primary mt-4 inline-block">
              返回会议详情
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link href={`/meetings/${params.id}`} className="text-gray-600 hover:text-gray-900 mr-4">
          ← 返回
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑会议</h1>
          <p className="text-gray-600 mt-1">修改会议信息，系统将自动同步访客信息</p>
        </div>
      </div>

      <div className="card bg-yellow-50 border-yellow-200 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 修改提示</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 修改会议时间或会议室后，系统将自动更新所有未入场访客的二维码和门禁权限</li>
          <li>• 如有访客已入场，系统会创建前台待办任务，通知工作人员人工处理</li>
          <li>• 访客会收到更新后的短信通知</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">基本信息</h2>

          <div>
            <label className="label">会议主题 *</label>
            <input
              type="text"
              className="input"
              placeholder="请输入会议主题"
              {...register('title', { required: '请输入会议主题' })}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">会议描述</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="请输入会议描述（可选）"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">会议室</label>
              <select className="input" {...register('roomId')}>
                <option value="">暂不选择</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.location}, 容纳{room.capacity}人)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">开始时间 *</label>
              <input
                type="datetime-local"
                className="input"
                {...register('startTime', { required: '请选择开始时间' })}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="label">结束时间 *</label>
              <input
                type="datetime-local"
                className="input"
                {...register('endTime', {
                  required: '请选择结束时间',
                })}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href={`/meetings/${params.id}`} className="btn btn-secondary">
            取消
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
}
