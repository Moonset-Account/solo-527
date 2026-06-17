import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { ShoppingBag, Filter, ChevronDown } from 'lucide-react';
import type { Product, MemberLevel, PaginatedResponse } from '@shared/types';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/products')({
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(16);
  const [filters, setFilters] = useState({
    category: '',
    minPoints: undefined as number | undefined,
    maxPoints: undefined as number | undefined,
    level: '',
    keyword: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();

  const categories = ['日用品', '洗护', '服饰', '玩具', '喂养', '配件', '用品', '护理'];

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, filters]);

  const fetchLevels = async () => {
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<Product> & { filters: any }>('/products', {
        ...filters,
        page,
        pageSize,
      });
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = (product: Product) => {
    if (!isAuthenticated || role !== 'member') {
      navigate({ to: '/login' });
      return;
    }
    navigate({ to: `/products/${product.id}` });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">全部商品</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-brand-300 transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">筛选</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-soft animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">商品分类</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最低积分</label>
              <input
                type="number"
                value={filters.minPoints || ''}
                onChange={(e) => setFilters((f) => ({ ...f, minPoints: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="最低积分"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最高积分</label>
              <input
                type="number"
                value={filters.maxPoints || ''}
                onChange={(e) => setFilters((f) => ({ ...f, maxPoints: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="最高积分"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">会员等级</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">全部等级</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => {
                setFilters({ category: '', minPoints: undefined, maxPoints: undefined, level: '', keyword: '' });
                setPage(1);
              }}
              className="px-5 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              重置
            </button>
            <button
              onClick={() => { setPage(1); setShowFilters(false); }}
              className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mb-4">
        共 <span className="text-brand-600 font-medium">{total}</span> 件商品
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无符合条件的商品</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleExchange(product)}
                className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-300 group animate-fadeInUp"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-cream-100 relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cream-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-medium">已兑完</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 min-h-[44px] text-sm">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="text-brand-600 font-bold">
                    {product.pointsPrice}
                    <span className="text-xs font-normal text-brand-500 ml-0.5">积分</span>
                  </div>
                  <span className="text-xs text-gray-400">库存 {product.stock}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
