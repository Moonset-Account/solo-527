import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { ArrowLeft, FileText, Calendar, Tag, Clock, User } from 'lucide-react';

export const Route = createFileRoute('/materials/$id')({
  component: MaterialDetailPage,
});

function MaterialDetailPage() {
  const { id } = Route.useParams();

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

        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
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
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Tag size={14} className="text-slate-400" />
          {materialTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block text-xs px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: tag.color || '#3b82f6' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <FileText size={18} className="text-blue-600" />
            选题脚本
          </h3>
          {scripts.length === 0 ? (
            <p className="text-sm text-slate-400">暂无关联脚本</p>
          ) : (
            <div className="space-y-3">
              {scripts.map((script) => (
                <div key={script.id} className="border border-slate-100 rounded-lg p-3">
                  <h4 className="font-medium text-sm">{script.title}</h4>
                  {script.content && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{script.content}</p>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    {script.createdBy} · {formatDate(script.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-green-600" />
            发布排期
          </h3>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-400">暂无发布排期</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{schedule.title}</h4>
                    <StatusBadge status={schedule.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {schedule.platform} · {formatDate(schedule.scheduledAt)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {schedule.createdBy} · {formatDate(schedule.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
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
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
