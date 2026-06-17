import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { ArrowLeft, Save, Package } from 'lucide-react';
import type { Product, MemberLevel } from '@shared/types';

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewPage,
});

function ProductNewPage() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    pointsPrice: 0,
    stock: 0,
    category: '',
    requiredLevelId: '',
    status: 'active',
  });

  const categories = ['日用品', '洗护', '服饰', '玩具', '喂养', '配件', '用品', '护理'];

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.pointsPrice <= 0) {
      alert('请填写商品名称和积分价格');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/products', {
        ...formData,
        requiredLevelId: formData.requiredLevelId || undefined,
      });
      alert('创建成功！');
      navigate({ to: '/admin/products' });
    } catch (e: any) {
      alert(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fadeIn">
      <button
        onClick={() => navigate({ to: '/admin/products' })}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回商品列表
      </button>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新建商品</h1>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入商品名称"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入商品描述"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">商品图片 URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                {formData.imageUrl && (
                  <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.imageUrl} alt="预览" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">积分价格 *</label>
                <input
                  type="number"
                  value={formData.pointsPrice}
                  onChange={(e) => setFormData({ ...formData, pointsPrice: Number(e.target.value) })}
                  min={0}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">库存数量</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  min={0}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所需会员等级</label>
                <select
                  value={formData.requiredLevelId}
                  onChange={(e) => setFormData({ ...formData, requiredLevelId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">不限等级</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="active">上架</option>
                  <option value="inactive">下架</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate({ to: '/admin/products' })}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? '保存中...' : '保存商品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
