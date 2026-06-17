import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Plus, Edit, Trash2, GripVertical, Award } from 'lucide-react';
import type { MemberLevel } from '@shared/types';

export const Route = createFileRoute('/admin/levels')({
  component: AdminLevelsPage,
});

function AdminLevelsPage() {
  const { role } = useAuthStore();
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    minGrowth: 0,
    icon: '',
    benefits: '',
    sortOrder: 0,
  });

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLevel(null);
    setFormData({ name: '', minGrowth: 0, icon: '', benefits: '', sortOrder: levels.length + 1 });
    setModalOpen(true);
  };

  const openEditModal = (level: MemberLevel) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      minGrowth: level.minGrowth,
      icon: level.icon || '',
      benefits: level.benefits || '',
      sortOrder: level.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('请输入等级名称');
      return;
    }

    try {
      if (editingLevel) {
        await api.put(`/admin/member-levels/${editingLevel.id}`, formData);
      } else {
        await api.post('/admin/member-levels', formData);
      }
      alert('保存成功！');
      setModalOpen(false);
      fetchLevels();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个等级吗？')) return;
    try {
      await api.delete(`/admin/member-levels/${id}`);
      alert('删除成功！');
      fetchLevels();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">等级配置</h1>
          <p className="text-gray-500 mt-1">共 {levels.length} 个会员等级</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新建等级
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-soft animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 mb-4" />
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))
        ) : (
          levels.map((level, index) => (
            <div
              key={level.id}
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-md transition-all animate-fadeInUp group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(level)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(level.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">{level.name}</h3>
              <p className="text-sm text-brand-600 font-medium mb-3">
                成长值 {level.minGrowth.toLocaleString()}+
              </p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {level.benefits || '暂无权益描述'}
              </p>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fadeInUp">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingLevel ? '编辑等级' : '新建等级'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">等级名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：金卡会员"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最低成长值 *</label>
                <input
                  type="number"
                  value={formData.minGrowth}
                  onChange={(e) => setFormData({ ...formData, minGrowth: Number(e.target.value) })}
                  min={0}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">权益描述</label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="描述该等级享有的权益"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
