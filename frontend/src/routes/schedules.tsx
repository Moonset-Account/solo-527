import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type PublishSchedule, type TopicScript } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, X, Calendar, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
});

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  draft: { label: '草稿', style: 'bg-slate-100 text-slate-600', icon: <Clock size={12} /> },
  scheduled: { label: '已排期', style: 'bg-blue-100 text-blue-700', icon: <Calendar size={12} /> },
  published: { label: '已发布', style: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  failed: { label: '发布失败', style: 'bg-red-100 text-red-700', icon: <AlertTriangle size={12} /> },
};

function SchedulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: schedules } = useQuery({
    queryKey: ['schedules', statusFilter],
    queryFn: () => api.schedules.list(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: scripts } = useQuery({
    queryKey: ['scripts-all'],
    queryFn: () => api.scripts.list(),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">发布排期</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          新建排期
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: '全部' },
          { value: 'draft', label: '草稿' },
          { value: 'scheduled', label: '已排期' },
          { value: 'published', label: '已发布' },
          { value: 'failed', label: '发布失败' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {schedules?.data.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} scripts={scripts?.data || []} />
        ))}
        {schedules?.data.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg">
            暂无发布排期
          </div>
        )}
      </div>

      {showCreate && (
        <ScheduleModal
          scripts={scripts?.data || []}
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function ScheduleCard({ schedule, scripts }: { schedule: PublishSchedule; scripts: TopicScript[] }) {
  const [showEdit, setShowEdit] = useState(false);
  const script = scripts.find((s) => s.id === schedule.scriptId);
  const status = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.draft;

  return (
    <>
      <div className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
        schedule.status === 'failed' ? 'border-red-200' : 'border-slate-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{schedule.title}</h3>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.style}`}>
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="text-sm text-slate-500 space-y-1">
              <div className="flex items-center gap-4">
                <span>平台：{schedule.platform}</span>
                {schedule.scheduledAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(schedule.scheduledAt)}
                  </span>
                )}
                {schedule.publishedAt && (
                  <span className="text-green-600">发布于：{formatDate(schedule.publishedAt)}</span>
                )}
              </div>
              {script && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">
                  <FileText size={10} />
                  关联脚本：{script.title}
                </span>
              )}
              <div className="text-xs text-slate-400 mt-1">
                责任人：{schedule.createdBy} · 创建：{formatDate(schedule.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {schedule.status === 'failed' && (
              <Link
                to="/exceptions"
                className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded hover:bg-red-100 transition-colors"
              >
                处理异常
              </Link>
            )}
            <button
              onClick={() => setShowEdit(true)}
              className="text-sm text-slate-500 hover:text-blue-600"
            >
              编辑
            </button>
          </div>
        </div>
      </div>
      {showEdit && (
        <ScheduleModal
          schedule={schedule}
          scripts={scripts}
          onClose={() => setShowEdit(false)}
          onSuccess={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

function ScheduleModal({
  schedule,
  scripts,
  onClose,
  onSuccess,
}: {
  schedule?: PublishSchedule;
  scripts: TopicScript[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(schedule?.title || '');
  const [scriptId, setScriptId] = useState(schedule?.scriptId || '');
  const [platform, setPlatform] = useState(schedule?.platform || '');
  const [scheduledAt, setScheduledAt] = useState(
    schedule?.scheduledAt ? schedule.scheduledAt.slice(0, 16) : ''
  );
  const [status, setStatus] = useState<PublishSchedule['status']>(schedule?.status || 'draft');
  const [createdBy, setCreatedBy] = useState(schedule?.createdBy || '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<PublishSchedule>) =>
      schedule ? api.schedules.update(schedule.id, data) : api.schedules.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<PublishSchedule> = {
      title,
      scriptId: scriptId || undefined,
      platform,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      status,
      createdBy: createdBy || '匿名',
    };
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{schedule ? '编辑发布排期' : '新建发布排期'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">平台 *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择平台</option>
                <option value="微信公众号">微信公众号</option>
                <option value="微博">微博</option>
                <option value="抖音">抖音</option>
                <option value="小红书">小红书</option>
                <option value="官网">官网</option>
                <option value="今日头条">今日头条</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">草稿</option>
                <option value="scheduled">已排期</option>
                <option value="published">已发布</option>
                <option value="failed">发布失败（会自动生成异常）</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">计划发布时间</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">关联脚本</label>
            <select
              value={scriptId}
              onChange={(e) => setScriptId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">暂不关联</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">责任人</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="输入姓名"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? '保存中...' : schedule ? '更新排期' : '创建排期'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
