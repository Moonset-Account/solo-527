import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type TopicScript, type PublishSchedule } from '../lib/api';
import { formatDate } from '../lib/utils';
import { ArrowLeft, FileText, Calendar, Tag, Clock, User, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/materials/$id')({
  component: MaterialDetailPage,
});

function MaterialDetailPage() {
  const { id } = Route.useParams();
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['dashboard', 'detail', id],
    queryFn: () => api.dashboard.detail(id),
  });

  const { data: history } = useQuery({
    queryKey: ['history', 'material', id],
    queryFn: () => api.history.byEntity('material', id),
  });

  if (isLoading) return <div className="p-6 text-slate-400">加载中...</div>;
  if (!detail) return <div className="p-6 text-slate-400">未找到素材</div>;

  const { material, tags: materialTags, scripts, schedules } = detail.data;

  return (
    <div className="p-6">
      <Link
        to="/materials"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft size={16} />
        返回素材列表
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{material.title}</h2>
        {material.description && (
          <p className="text-slate-600 mt-2">{material.description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <User size={14} />
            {material.uploadedBy}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDate(material.createdAt)}
          </span>
          {material.reuseCount != null && material.reuseCount > 0 && (
            <span className="text-amber-600 font-medium">复用 {material.reuseCount} 次</span>
          )}
          {material.fileUrl && (
            <a href={material.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              查看文件
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Tag size={14} className="text-slate-400" />
          {materialTags.length > 0 ? (
            materialTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block text-xs px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: tag.color || '#3b82f6' }}
              >
                {tag.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">暂无标签</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              选题脚本 ({scripts.length})
            </h3>
            <button
              onClick={() => setShowScriptModal(true)}
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} />
              新建脚本
            </button>
          </div>
          {scripts.length === 0 ? (
            <p className="text-sm text-slate-400">暂无关联脚本，点击上方按钮基于此素材创建</p>
          ) : (
            <div className="space-y-3">
              {scripts.map((script) => (
                <div key={script.id} className="border border-slate-100 rounded-lg p-3">
                  <h4 className="font-medium text-sm text-slate-900">{script.title}</h4>
                  {script.content && (
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap line-clamp-3">{script.content}</p>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    <User size={10} className="inline mr-0.5" />
                    {script.createdBy} · {formatDate(script.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-green-600" />
              发布排期 ({schedules.length})
            </h3>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Plus size={14} />
              新建排期
            </button>
          </div>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-400">暂无发布排期，点击上方按钮创建</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-slate-900">{schedule.title}</h4>
                    <StatusBadge status={schedule.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {schedule.platform} · {schedule.scheduledAt ? formatDate(schedule.scheduledAt) : '未排期'}
                  </div>
                  <div className="text-xs text-slate-400">
                    <User size={10} className="inline mr-0.5" />
                    {schedule.createdBy} · {formatDate(schedule.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Clock size={18} className="text-purple-600" />
          操作历史
        </h3>
        {history && history.data.length > 0 ? (
          <div className="space-y-3">
            {history.data.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-slate-700 font-medium">{log.operator}</span>
                  <span className="text-slate-500 ml-1">
                    {log.action === 'create' ? '创建了' : log.action === 'update' ? '更新了' : log.action === 'delete' ? '删除了' : log.action}
                    该素材
                  </span>
                  <span className="text-slate-400 ml-2">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">暂无操作历史</p>
        )}
      </div>

      {showScriptModal && (
        <ScriptModal
          materialId={id}
          materialTitle={material.title}
          onClose={() => setShowScriptModal(false)}
          onSuccess={() => {
            setShowScriptModal(false);
          }}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          scripts={scripts}
          materialTitle={material.title}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    draft: '草稿',
    scheduled: '已排期',
    published: '已发布',
    failed: '发布失败',
  };
  const Icons: Record<string, React.ReactNode> = {
    draft: <Clock size={10} />,
    scheduled: <Calendar size={10} />,
    published: <CheckCircle size={10} />,
    failed: <AlertTriangle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
      {Icons[status]}
      {labels[status] || status}
    </span>
  );
}

function ScriptModal({
  materialId,
  materialTitle,
  onClose,
  onSuccess,
}: {
  materialId: string;
  materialTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(`${materialTitle} - 脚本`);
  const [content, setContent] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<TopicScript>) => api.scripts.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'detail'] });
      qc.invalidateQueries({ queryKey: ['scripts'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title,
      content: content || undefined,
      materialId,
      createdBy: createdBy || '匿名',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">基于素材新建选题脚本</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="mb-4 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          关联素材：{materialTitle}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">脚本标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">脚本内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="输入选题脚本正文..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
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
              {mutation.isPending ? '保存中...' : '创建脚本'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleModal({
  scripts,
  materialTitle,
  onClose,
  onSuccess,
}: {
  scripts: TopicScript[];
  materialTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(`${materialTitle} - 发布`);
  const [scriptId, setScriptId] = useState(scripts[0]?.id || '');
  const [platform, setPlatform] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<PublishSchedule['status']>('draft');
  const [createdBy, setCreatedBy] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<PublishSchedule>) => api.schedules.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'detail'] });
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title,
      scriptId: scriptId || undefined,
      platform,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      status,
      createdBy: createdBy || '匿名',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">基于素材新建发布排期</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="mb-4 text-xs text-slate-500 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          关联素材：{materialTitle}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">排期标题 *</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">发布平台 *</label>
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
            {scripts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">此素材暂无脚本，可先创建脚本后再关联</p>
            )}
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
              disabled={mutation.isPending || !platform}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? '保存中...' : '创建排期'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
