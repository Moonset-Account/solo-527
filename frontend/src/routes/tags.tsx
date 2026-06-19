import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, X, Tag as TagIcon } from 'lucide-react';

export const Route = createFileRoute('/tags')({
  component: TagsPage,
});

function TagsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const qc = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.tags.list(),
  });

  const { data: tagDist } = useQuery({
    queryKey: ['dashboard', 'tag-distribution'],
    queryFn: () => api.dashboard.tagDistribution(),
  });

  const createMutation = useMutation({
    mutationFn: api.tags.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      setShowCreate(false);
      setNewName('');
      setNewColor('#3b82f6');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.tags.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">标签管理</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          新建标签
        </button>
      </div>

      {tagDist && tagDist.data.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">标签分布</h3>
          <div className="flex flex-wrap gap-3">
            {tagDist.data.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium text-slate-700">{tag.name}</span>
                <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded">
                  {tag.count}个素材
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="divide-y divide-slate-100">
          {tags?.data.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                >
                  <TagIcon size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{tag.name}</p>
                  <p className="text-xs text-slate-400">
                    创建于 {new Date(tag.createdAt).toLocaleDateString('zh-CN')}
                    {tag.usageCount != null && ` · ${tag.usageCount}个素材使用`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`确认删除标签「${tag.name}」？`)) {
                    deleteMutation.mutate(tag.id);
                  }
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {tags?.data.length === 0 && (
            <div className="text-center py-12 text-slate-400">暂无标签</div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">新建标签</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                createMutation.mutate({ name: newName.trim(), color: newColor });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标签名称 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">颜色</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-500">{newColor}</span>
                  <div className="flex gap-1.5 ml-3">
                    {['#3b82f6', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? '创建中...' : '创建标签'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
