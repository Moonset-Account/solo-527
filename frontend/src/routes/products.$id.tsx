import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { ShoppingBag, Minus, Plus, ArrowLeft, Shield, Truck, Gift } from 'lucide-react';
import type { Product } from '@shared/types';
import { formatNumber } from '@/utils';

export const Route = createFileRoute('/products/$id')({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [exchanging, setExchanging] = useState(false);
  const { isAuthenticated, role, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await api.get<Product>(`/products/${id}`);
      setProduct(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    if (!isAuthenticated || role !== 'member') {
      navigate({ to: '/login' });
      return;
    }

    if (!product) return;

    const member = user as any;
    const totalPoints = product.pointsPrice * quantity;
    if (member?.points < totalPoints) {
      alert('积分不足，无法兑换');
      return;
    }

    setExchanging(true);
    try {
      const order = await api.post('/orders', {
        productId: product.id,
        quantity,
      });
      alert('兑换成功！');
      navigate({ to: `/my/orders/${order.id}` });
    } catch (e: any) {
      alert(e.message || '兑换失败');
    } finally {
      setExchanging(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">商品不存在</p>
        <button
          onClick={() => navigate({ to: '/products' })}
          className="mt-4 text-brand-600 hover:text-brand-700"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  const totalPoints = product.pointsPrice * quantity;
  const member = user as any;
  const canExchange = product.stock > 0 && (member?.points >= totalPoints || role !== 'member');

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate({ to: -1 as any })}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="animate-fadeInUp">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-soft">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cream-200 bg-cream-50">
                <ShoppingBag className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="mb-2">
            {product.category && (
              <span className="inline-block px-3 py-1 bg-brand-50 text-brand-600 text-xs rounded-full">
                {product.category}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-brand-600">
              {formatNumber(product.pointsPrice)}
            </span>
            <span className="text-brand-500">积分</span>
            <span className="text-sm text-gray-400 ml-3">库存 {product.stock} 件</span>
          </div>

          {product.requiredLevel && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium">{product.requiredLevel.name} 及以上专享</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">商品描述</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || '暂无商品描述'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-cream-50 rounded-xl">
              <Truck className="w-6 h-6 mx-auto text-brand-500 mb-2" />
              <p className="text-xs text-gray-600">门店自提</p>
            </div>
            <div className="text-center p-4 bg-cream-50 rounded-xl">
              <Shield className="w-6 h-6 mx-auto text-brand-500 mb-2" />
              <p className="text-xs text-gray-600">品质保证</p>
            </div>
            <div className="text-center p-4 bg-cream-50 rounded-xl">
              <Gift className="w-6 h-6 mx-auto text-brand-500 mb-2" />
              <p className="text-xs text-gray-600">积分兑换</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">兑换数量</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-brand-400 transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-brand-400 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-600">总计积分</span>
              <span className="text-2xl font-bold text-brand-600">{formatNumber(totalPoints)}</span>
            </div>
          </div>

          <button
            onClick={handleExchange}
            disabled={!canExchange || exchanging || product.stock === 0}
            className="w-full mt-6 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {exchanging ? '兑换中...' : product.stock === 0 ? '已兑完' : '立即兑换'}
          </button>

          {isAuthenticated && role === 'member' && member && member.points < totalPoints && (
            <p className="text-center text-red-500 text-sm mt-3">
              积分不足，还差 {formatNumber(totalPoints - member.points)} 积分
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
