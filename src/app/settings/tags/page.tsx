'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tags, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { TAG_CATEGORIES } from '@/lib/constants';

const TAG_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#0891B2', '#6B7280', '#D4A853', '#14B8A6'];

export default function TagsPage() {
  const { tags, createTag, updateTag, deleteTag, currentUser } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [category, setCategory] = useState('priority');

  const handleOpen = (tag?: typeof tags[0]) => {
    if (tag) {
      setEditingId(tag.id);
      setName(tag.name);
      setColor(tag.color);
      setCategory(tag.category);
    } else {
      setEditingId(null);
      setName('');
      setColor(TAG_COLORS[0]);
      setCategory('priority');
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateTag(editingId, { name, color, category, updated_by: currentUser?.id });
    } else {
      createTag({ name, color, category, created_by: currentUser?.id, updated_by: currentUser?.id });
    }
    setOpen(false);
  };

  const groupedTags = TAG_CATEGORIES.map((cat) => ({
    ...cat,
    items: tags.filter((t) => t.category === cat.value),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary-500" />
                客户标签管理
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">按分类维护客户标签，方便快速筛选和识别客户特征</p>
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => handleOpen()}>
              新增标签
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {groupedTags.map((group) => (
                <div key={group.value}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                    <h4 className="text-sm font-semibold text-gray-800">{group.label}</h4>
                    <span className="text-xs text-gray-400">({group.items.length}个)</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {group.items.map((t) => (
                      <div
                        key={t.id}
                        className="group relative inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border hover:shadow-md transition-all"
                        style={{
                          backgroundColor: t.color + '12',
                          borderColor: t.color + '30',
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-xs font-medium" style={{ color: t.color }}>
                          {t.name}
                        </span>
                        <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpen(t)}
                            className="p-0.5 rounded hover:bg-white/80"
                          >
                            <Edit2 className="h-3 w-3" style={{ color: t.color }} />
                          </button>
                          <button
                            onClick={() => deleteTag(t.id)}
                            className="p-0.5 rounded hover:bg-white/80"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {group.items.length === 0 && (
                      <span className="text-xs text-gray-400 italic">暂无标签</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={editingId ? '编辑标签' : '新增标签'}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} leftIcon={<Check className="h-4 w-4" />}>保存</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">标签名称 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="如：高意向客户、学区房..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">所属分类</label>
              <Select
                options={TAG_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                value={category}
                onChange={setCategory}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">标签颜色</label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all border-2',
                      color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: color + '15', borderColor: color + '30' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium" style={{ color }}>
                  {name || '标签预览'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
