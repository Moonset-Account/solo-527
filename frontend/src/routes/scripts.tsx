import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type TopicScript, type Material } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, X, FileText, Link as LinkIcon } from 'lucide-react';

export const Route = createFileRoute('/scripts')({
  component: ScriptsPage,
});

function ScriptsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [materialFilter, setMaterialFilter] = useState('');

  const { data: scripts } = useQuery({
    queryKey: ['scripts', materialFilter],
    queryFn: () => api.scripts.list(materialFilter ? { materialId: materialFilter } : undefined),
  });

  const { data: materials } = useQuery({
    queryKey: ['materials-select'],
    queryFn: () => api.materials.list({ limit: '100' }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">选题脚本</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          新建脚本
        </button>
      </div>

      <div className="mb-4">
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部素材的脚本</option>
          {materials?.data.map((m: Material) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {scripts?.data.map((script) => (
          <ScriptCard key={script.id} script={script} materials={materials?.data || []} />
        ))}
        {scripts?.data.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg">
            暂无选题脚本，点击上方按钮新建
          </div>
        )}
      </div>

      {showCreate && (
        <ScriptModal
          materials={materials?.data || []}
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function ScriptCard({ script, materials }: { script: TopicScript; materials: Material[] }) {
  const material = materials.find((m) => m.id === script.materialId);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              {script.title}
            </h3>
            {script.content && (
              <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap line-clamp-4">{script.content}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span>作者：{script.createdBy}</span>
              <span>创建：{formatDate(script.createdAt)}</span>
              {script.updatedAt !== script.createdAt && (
                <span>更新：{formatDate(script.updatedAt)}</span>
              )}
              {material && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  <LinkIcon size={10} />
                  素材：{material.title}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="text-sm text-slate-500 hover:text-blue-600"
          >
            编辑
          </button>
        </div>
      </div>
      {showEdit && (
        <ScriptModal
          script={script}
          materials={materials}
          onClose={() => setShowEdit(false)}
          onSuccess={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

function ScriptModal({
  script,
  materials,
  onClose,
  onSuccess,
}: {
  script?: TopicScript;
  materials: Material[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(script?.title || '');
  const [content, setContent] = useState(script?.content || '');
  const [materialId, setMaterialId] = useState(script?.materialId || '');
  const [createdBy, setCreatedBy] = useState(script?.createdBy || '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<TopicScript>) =>
      script ? api.scripts.update(script.id, data) : api.scripts.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title,
      content: content || undefined,
      materialId: materialId || undefined,
      createdBy: createdBy || '匿名',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{script ? '编辑选题脚本' : '新建选题脚本'}</h3>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">关联素材</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">暂不关联</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">关联后可在素材详情页看到该脚本</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">脚本内容</label>
            <textarea
              value={content || ''}
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
              {mutation.isPending ? '保存中...' : script ? '更新脚本' : '创建脚本'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
