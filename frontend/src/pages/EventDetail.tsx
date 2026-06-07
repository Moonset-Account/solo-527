import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { eventsAPI, attachmentsAPI, notificationsAPI } from '../api';
import type { SafetyEvent, Attachment } from '../types';
import { levelConfig, statusConfig, notificationConfig, formatDuration, formatFileSize } from '../utils';
import { useAuth } from '../auth';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isProjectManager, user } = useAuth();
  const [event, setEvent] = useState<SafetyEvent | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessRole, setAccessRole] = useState('all');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eventData, attachmentData] = await Promise.all([
        eventsAPI.get(id),
        attachmentsAPI.getByEvent(id),
      ]);
      setEvent(eventData);
      setAttachments(attachmentData);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    try {
      await eventsAPI.confirm(id);
      loadData();
    } catch (error) {
      console.error('Failed to confirm event:', error);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await eventsAPI.close(id);
      loadData();
    } catch (error) {
      console.error('Failed to close event:', error);
    }
  };

  const handleResendNotification = async () => {
    if (!id) return;
    try {
      await notificationsAPI.resend(id);
      loadData();
    } catch (error) {
      console.error('Failed to resend notification:', error);
    }
  };

  const handleUpload = async () => {
    if (!id || !selectedFile) return;
    try {
      await attachmentsAPI.upload(id, selectedFile, accessRole);
      setSelectedFile(null);
      loadData();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (!event) {
    return <div className="text-center py-16 text-gray-500">事件不存在</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-primary-600 hover:text-primary-500 mb-4 flex items-center gap-2"
        >
          ← 返回看板
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{event.title}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelConfig[event.level].bgColor} ${levelConfig[event.level].color}`}>
                {levelConfig[event.level].label}级
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[event.status].bgColor} ${statusConfig[event.status].color}`}>
                {statusConfig[event.status].label}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {event.status === 'unconfirmed' && isProjectManager && (
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500"
              >
                确认处理
              </button>
            )}
            {event.status === 'processing' && isProjectManager && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                关闭事件
              </button>
            )}
            {event.notification_status === 'failed' && isProjectManager && (
              <button
                onClick={handleResendNotification}
                className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-amber-600"
              >
                补发通知
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">事件详情</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
            {event.original_record_url && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <a
                  href={event.original_record_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline flex items-center gap-2"
                >
                  🔗 查看原始记录
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">处理时间线</h2>
            <div className="relative pl-8">
              <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gray-200" />
              {[
                { time: event.actual_occurred_at, label: '真实发生时间', icon: '⚡', color: 'bg-red-500' },
                { time: event.recorded_at, label: '补录时间', icon: '📝', color: 'bg-blue-500' },
                { time: event.confirmed_at, label: '确认处理', icon: '✅', color: 'bg-green-500' },
                { time: event.closed_at, label: '事件关闭', icon: '🔒', color: 'bg-gray-500' },
              ].filter(t => t.time).map((item, idx) => (
                <div key={idx} className="relative mb-6 last:mb-0">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-xs`}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-medium text-gray-800">{item.label}</div>
                  <div className="text-sm text-gray-500">
                    {dayjs(item.time!).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">附件管理</h2>
              <div className="flex items-center gap-2">
                <select
                  value={accessRole}
                  onChange={(e) => setAccessRole(e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option value="all">全部可见</option>
                  <option value="teacher">老师可见</option>
                  <option value="project_manager">仅负责人</option>
                </select>
                <label className="px-3 py-1.5 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-500 text-sm">
                  上传附件
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
            {selectedFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm">{selectedFile.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    确认上传
                  </button>
                </div>
              </div>
            )}
            {attachments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无附件</div>
            ) : (
              <div className="space-y-3">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{att.filename}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(att.file_size)} · 上传者: {att.uploaded_by_name || '未知'}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/api/attachments/${att.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm"
                    >
                      下载
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">基本信息</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">签到点</span>
                <span className="text-gray-800 font-medium">{event.checkpoint_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">带队老师</span>
                <span className="text-gray-800 font-medium">{event.teacher_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">复盘责任人</span>
                <span className="text-gray-800 font-medium">{event.reviewer_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">处理时长</span>
                <span className="text-gray-800 font-medium">{formatDuration(event.handle_duration_minutes)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">家长通知</span>
                  <span className={`font-medium ${notificationConfig[event.notification_status].color}`}>
                    {notificationConfig[event.notification_status].icon} {notificationConfig[event.notification_status].label}
                  </span>
                </div>
                {event.notification_attempts > 0 && (
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    尝试 {event.notification_attempts} 次
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">补录信息</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <div className="text-amber-800 mb-2">
                <strong>注意:</strong> 处理时长统计基于 <strong>真实发生时间</strong> 计算
              </div>
              <div className="space-y-2 text-amber-700">
                <div className="flex justify-between">
                  <span>真实发生时间</span>
                  <span>{dayjs(event.actual_occurred_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>系统补录时间</span>
                  <span>{dayjs(event.recorded_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
