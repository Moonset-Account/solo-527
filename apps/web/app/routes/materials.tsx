import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

export default function Materials() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    qrCode: '',
    condition: 'good',
    purchaseDate: '',
    purchasePrice: '',
    location: '',
    remarks: '',
  });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, isAuthenticated, navigate]);

  useEffect(() => {
    if (token) {
      loadMaterials();
    }
  }, [token, search, filterStatus, filterCategory]);

  const loadData = async () => {
    if (!token) return;
    try {
      const cats: any = await api.materials.categories(token);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadMaterials = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.categoryId = filterCategory;
      
      const data: any = await api.materials.list(token, params);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载物资失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      await api.materials.create(token, {
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      });
      setShowModal(false);
      setFormData({
        categoryId: '',
        name: '',
        qrCode: '',
        condition: 'good',
        purchaseDate: '',
        purchasePrice: '',
        location: '',
        remarks: '',
      });
      loadMaterials();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    borrowed: 'bg-blue-100 text-blue-800',
    damaged: 'bg-red-100 text-red-800',
    repairing: 'bg-orange-100 text-orange-800',
    scrapped: 'bg-gray-100 text-gray-800',
  };

  const statusText: Record<string, string> = {
    available: '可借',
    reserved: '已预占',
    borrowed: '已借出',
    damaged: '已损坏',
    repairing: '维修中',
    scrapped: '已报废',
  };

  const conditionText: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差',
  };

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">物资管理</h1>
          {(user?.role === 'warehouse_manager' || user?.role === 'admin') && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              + 添加物资
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <input
                type="text"
                placeholder="搜索物资名称或二维码..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="available">可借</option>
              <option value="reserved">已预占</option>
              <option value="borrowed">已借出</option>
              <option value="damaged">已损坏</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部分类</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">二维码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">成色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        暂无物资数据
                      </td>
                    </tr>
                  ) : (
                    materials.map((mat: any) => (
                      <tr key={mat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {mat.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {mat.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {mat.qr_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[mat.status]}`}>
                            {statusText[mat.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {conditionText[mat.condition]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {mat.location || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">添加物资</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      required
                    >
                      <option value="">请选择分类</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">物资名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">二维码</label>
                    <input
                      type="text"
                      value={formData.qrCode}
                      onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">成色</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value="excellent">优秀</option>
                      <option value="good">良好</option>
                      <option value="fair">一般</option>
                      <option value="poor">较差</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">购买价格</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
