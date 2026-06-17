import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { ShoppingBag, Lock, User } from 'lucide-react';
import type { Product, MemberLevel, PaginatedResponse } from '@shared/types';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: '全部' },
    { id: '日用品', name: '日用品' },
    { id: '洗护', name: '洗护' },
    { id: '服饰', name: '服饰' },
    { id: '玩具', name: '玩具' },
    { id: '喂养', name: '喂养' },
    { id: '配件', name: '配件' },
  ];

  useEffect(() => {
    fetchData();
    fetchLevels();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<Product> & { filters: any }>('/products', {
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        pageSize: 12,
      });
      setProducts(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExchange = (product: Product) => {
    if (!isAuthenticated || role !== 'member') {
      navigate({ to: '/login' });
      return;
    }
    navigate({ to: `/products/${product.id}` });
  };

  const member = user as any;

  return (
    <div className="animate-fadeIn">
      <div className="bg-gradient-to-br from-brand-500 via-brand-400 to-brand-600 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">母婴会员积分商城</h1>
          <p className="text-brand-100 mb-6">精选好物，积分免费兑，越兑越划算</p>

          {isAuthenticated && role === 'member' && member ? (
            <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl p-5">
              <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{member.nickname || '会员'}</div>
                <div className="text-brand-100 text-sm mt-0.5">
                  {levels.find((l) => l.id === member.levelId)?.name || '普通会员'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{member.points || 0}</div>
                <div className="text-brand-100 text-sm">可用积分</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate({ to: '/login' })}
              className="px-6 py-3 bg-white text-brand-600 rounded-xl font-medium hover:bg-brand-50 transition-colors"
            >
              立即登录兑好物
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">热门兑换</h2>
        <button
          onClick={() => navigate({ to: '/products' })}
          className="text-brand-600 text-sm font-medium hover:text-brand-700"
        >
          查看全部 →
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-brand-50 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleExchange(product)}
              className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-300 group animate-fadeInUp"
              style={{ animationDelay: `${index * 0.05}s` }}
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
                {product.stock < 10 && product.stock > 0 && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-accent-500 text-white text-xs rounded-full">
                    仅剩{product.stock}件
                  </span>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-medium">已兑完</span>
                  </div>
                )}
              </div>
              <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 min-h-[44px]">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-brand-600 font-bold text-lg">
                  {product.pointsPrice}
                  <span className="text-sm font-normal text-brand-500 ml-0.5">积分</span>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    product.stock > 0
                      ? 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={product.stock === 0}
                >
                  立即兑换
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-white rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">会员等级权益</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {levels.map((level, index) => (
            <div
              key={level.id}
              className="text-center p-5 rounded-xl bg-gradient-to-b from-cream-50 to-white border border-cream-200 hover:shadow-md transition-shadow animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                {level.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{level.name}</h3>
              <p className="text-sm text-gray-500 mb-2">成长值 {level.minGrowth}+</p>
              <p className="text-xs text-gray-400">{level.benefits}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
