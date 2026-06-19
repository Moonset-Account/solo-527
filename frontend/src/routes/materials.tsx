import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type Material, type Tag } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, Search, FileText, X } from 'lucide-react';

export const Route = createFileRoute('/materials')({
  component: MaterialsPage,
});

function MaterialsPage() {
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  const { data: materials } = useQuery({
    queryKey: ['materials', search],
    queryFn: () => api.materials.list(search ? { q: search } : undefined),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.tags.list(),
  });

  const { data: reuseSuggestions } = useQuery({
    queryKey: ['materials', 'reuse'],
    queryFn: () => api.materials.reuseSuggestions(),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">素材管理</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          上传素材
        </button>
      </div>

      {reuseSuggestions && reuseSuggestions.data.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">素材复用提醒</h3>
          <div className="flex flex-wrap gap-2">
            {reuseSuggestions.data.map((m) => (
              <Link
                key={m.id}
                to="/materials/$id"
                params={{ id: m.id }}
                className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-sm hover:bg-amber-200 transition-colors"
              >
                <FileText size={14} />
                {m.title}
                <span className="text-amber-600">({m.reuseCount}次复用)</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索素材..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            if (e.target.value) {
              setSearch('');
            }
          }}
        >
          <option value="">全部标签</option>
          {tags?.data.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {materials?.data.map((material) => (
          <MaterialCard key={material.id} material={material} tags={tags?.data || []} />
        ))}
        {materials?.data.length === 0 && (
          <div className="text-center py-12 text-slate-400">暂无素材，点击上方按钮上传</div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          tags={tags?.data || []}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            qc.invalidateQueries({ queryKey: ['materials'] });
          }}
        />
      )}
    </div>
  );
}

function MaterialCard({ material, tags }: { material: Material; tags: Tag[] }) {
  const materialTags = tags.filter((t) => material.tagIds?.includes(t.id));

  return (
    <Link
      to="/materials/$id"
      params={{ id: material.id }}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{material.title}</h3>
          {material.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {materialTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tag.color || '#3b82f6' }}
              >
                {tag.name}
              </span>
            ))}
            {material.fileType && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {material.fileType}
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400 ml-4">
          <div>{material.uploadedBy}</div>
          <div className="mt-1">{formatDate(material.createdAt)}</div>
          {material.reuseCount != null && material.reuseCount > 0 && (
            <div className="mt-1 text-amber-600">复用 {material.reuseCount} 次</div>
          )}
        </div>
      </div>
    </Link>
  );
}

function UploadModal({
  tags,
  onClose,
  onSuccess,
}: {
  tags: Tag[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: api.materials.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      onSuccess();
    },
  });

  const createTagMutation = useMutation({
    mutationFn: api.tags.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate(
      { name: newTagName.trim() },
      {
        onSuccess: (res) => {
          setSelectedTags((prev) => [...prev, res.data.id]);
          setNewTagName('');
        },
      }
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description: description || undefined,
      fileUrl: fileUrl || undefined,
      fileType: fileType || undefined,
      uploadedBy: uploadedBy || '匿名',
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">上传采访素材</h3>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">文件链接</label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">文件类型</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择类型</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="audio">音频</option>
                <option value="document">文档</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">上传人</label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder="输入姓名"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={
                    selectedTags.includes(tag.id)
                      ? { backgroundColor: tag.color || '#3b82f6' }
                      : undefined
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="新建标签"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                添加
              </button>
            </div>
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
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? '上传中...' : '上传素材'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
