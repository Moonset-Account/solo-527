'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { formatDateTime, cn } from '@/lib/utils';
import { Settings2, Plus, Edit2, Trash2, GripVertical, Check, X, User } from 'lucide-react';

const PRESET_COLORS = ['#9CA3AF', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#059669', '#EF4444', '#0891B2', '#D4A853'];

export default function StagesPage() {
  const { stages, createStage, updateStage, deleteStage, users, currentUser } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[2]);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleOpen = (stage?: typeof stages[0]) => {
    if (stage) {
      setEditingId(stage.id);
      setName(stage.name);
      setColor(stage.color);
      setOrder(stage.order);
      setIsActive(stage.is_active);
    } else {
      setEditingId(null);
      setName('');
      setColor(PRESET_COLORS[2]);
      setOrder(sortedStages.length);
      setIsActive(true);
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateStage(editingId, { name, color, order, is_active: isActive, updated_by: currentUser?.id });
    } else {
      createStage({ name, color, order, is_active: isActive, created_by: currentUser?.id, updated_by: currentUser?.id });
    }
    setOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary-500" />
                跟进阶段配置
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">管理线索跟进管道的各个阶段，修改会记录操作人信息</p>
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => handleOpen()}>
              新增阶段
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium w-10"></th>
                    <th className="px-5 py-3.5 font-medium">阶段名称</th>
                    <th className="px-5 py-3.5 font-medium">颜色标识</th>
                    <th className="px-5 py-3.5 font-medium">排序</th>
                    <th className="px-5 py-3.5 font-medium">状态</th>
                    <th className="px-5 py-3.5 font-medium">最后修改人</th>
                    <th className="px-5 py-3.5 font-medium">最后修改时间</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStages.map((s) => {
                    const updater = users.find((u) => u.id === s.updated_by);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="font-medium text-gray-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md border border-gray-200" style={{ backgroundColor: s.color }} />
                            <code className="text-xs text-gray-500 font-mono">{s.color}</code>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-mono text-gray-600">{s.order}</span>
                        </td>
                        <td className="px-5 py-4">
                          {s.is_active ? (
                            <Badge variant="success" dot>启用中</Badge>
                          ) : (
                            <Badge variant="default" dot>已停用</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {updater ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full gradient-card-blue flex items-center justify-center text-white text-[10px] font-semibold">
                                {updater.name.slice(0, 1)}
                              </div>
                              <span className="text-sm text-gray-600">{updater.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">系统默认</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400">{formatDateTime(s.updated_at)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpen(s)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {s.order >= 2 && s.order <= 5 && (
                              <button
                                onClick={() => deleteStage(s.id)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={editingId ? '编辑跟进阶段' : '新增跟进阶段'}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} leftIcon={<Check className="h-4 w-4" />}>
                保存
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">阶段名称 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="如：客户确认、设计方案..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">颜色标识</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">排序值</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
                <div className="flex items-center h-10 gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={isActive} onChange={() => setIsActive(true)} className="accent-primary-500" />
                    <span className="text-sm text-gray-700">启用</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={!isActive} onChange={() => setIsActive(false)} className="accent-primary-500" />
                    <span className="text-sm text-gray-700">停用</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
