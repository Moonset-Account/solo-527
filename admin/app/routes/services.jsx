import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';

export default function Services() {
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '空调',
    description: '',
    basePrice: 0,
    serviceFee: 0,
    duration: 60,
    warrantyDays: 90,
    status: 'active',
    sortOrder: 0
  });
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'active'
  });
  
  useEffect(() => {
    loadServices();
  }, [pagination.page, filters]);
  
  const loadServices = async () => {
    setLoading(true);
    try {
      const result = await api.get('/services', {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      });
      if (result.success) {
        setServices(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载服务项失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem._id}`, formData);
      } else {
        await api.post('/services', formData);
      }
      setShowModal(false);
      loadServices();
      resetForm();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个服务项吗？')) return;
    try {
      await api.delete(`/services/${id}`);
      loadServices();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };
  
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: '空调',
      description: '',
      basePrice: 0,
      serviceFee: 0,
      duration: 60,
      warrantyDays: 90,
      status: 'active',
      sortOrder: 0
    });
  };
  
  const categories = ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'];
  
  return (
    <AdminLayout title="服务项管理">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="select"
              style={{ width: '150px' }}
            >
              <option value="all">全部分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="select"
              style={{ width: '120px' }}
            >
              <option value="all">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn btn-primary"
          >
            + 新增服务项
          </button>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">基础价格</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">上门费</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">时长(分钟)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">保修天数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                services.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">¥{item.basePrice?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{item.serviceFee?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.duration}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.warrantyDays}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.status === 'active' ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {pagination.total > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 条，第 {pagination.page} / {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingItem ? '编辑服务项' : '新增服务项'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">服务名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">服务分类 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">基础价格(元) *</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">上门服务费(元)</label>
                  <input
                    type="number"
                    value={formData.serviceFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceFee: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="label">预计时长(分钟)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">保修天数</label>
                  <input
                    type="number"
                    value={formData.warrantyDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyDays: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="select"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">服务描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
