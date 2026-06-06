'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface VisitorForm {
  name: string;
  phone: string;
  idCardNumber?: string;
  company?: string;
}

interface MeetingForm {
  title: string;
  description?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  visitors: VisitorForm[];
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<MeetingForm>({
    defaultValues: {
      visitors: [{ name: '', phone: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'visitors',
  });

  const roomId = watch('roomId');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }

  async function onSubmit(data: MeetingForm) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        alert('会议创建成功！已自动生成访客邀请、二维码和门禁权限。');
        router.push(`/meetings/${result.meeting.id}`);
      } else {
        const error = await res.json();
        alert(error.error || '创建会议失败');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('创建会议失败');
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link href="/meetings" className="text-gray-600 hover:text-gray-900 mr-4">
          ← 返回
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创建会议</h1>
          <p className="text-gray-600 mt-1">填写会议信息并邀请访客</p>
        </div>
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
                min={minDateTime}
                {...register('startTime', { required: '请选择开始时间' })}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="label">结束时间 *</label>
              <input
                type="datetime-local"
                className="input"
                min={startTime || minDateTime}
                {...register('endTime', {
                  required: '请选择结束时间',
                  validate: (value) =>
                    !startTime || new Date(value) > new Date(startTime) || '结束时间必须晚于开始时间',
                })}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">访客信息</h2>
            <button
              type="button"
              onClick={() => append({ name: '', phone: '' })}
              className="btn btn-secondary text-sm"
            >
              + 添加访客
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">访客 {index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      移除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">姓名 *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="请输入访客姓名"
                      {...register(`visitors.${index}.name` as const, {
                        required: '请输入访客姓名',
                      })}
                    />
                    {errors.visitors?.[index]?.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.visitors[index]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">手机号 *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="请输入手机号"
                      {...register(`visitors.${index}.phone` as const, {
                        required: '请输入手机号',
                        pattern: {
                          value: /^1[3-9]\d{9}$/,
                          message: '请输入有效的手机号',
                        },
                      })}
                    />
                    {errors.visitors?.[index]?.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.visitors[index]?.phone?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">身份证号</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="请输入身份证号（可选）"
                      {...register(`visitors.${index}.idCardNumber` as const)}
                    />
                  </div>
                  <div>
                    <label className="label">公司</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="请输入公司名称（可选）"
                      {...register(`visitors.${index}.company` as const)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href="/meetings" className="btn btn-secondary">
            取消
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '创建中...' : '创建会议'}
          </button>
        </div>
      </form>
    </div>
  );
}
