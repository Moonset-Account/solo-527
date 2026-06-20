import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [stockForm, setStockForm] = useState({ type: 'in', quantity: 0, remark: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '空调配件',
    brand: '',
    model: '',
    specification: '',
    unit: '个',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 0,
    location: '',
    status: 'active',
    warrantyMonths: 12,
    supplier: '',
    remark: ''
  });
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'active',
    keyword: ''
  });
  
  const categories = ['空调配件', '冰箱配件', '洗衣机配件', '电视配件', '热水器配件', '燃气灶配件', '油烟机配件', '通用配件', '其他'];
  const units = ['个', '件', '套', '米', '公斤', '箱', '其他'];
  
  useEffect(() => {
    loadParts();
  }, [pagination.page, filters]);
  
  const loadParts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const result = await api.get('/parts', params);
      if (result.success) {
        setParts(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载配件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/parts/${editingItem._id}`, formData);
      } else {
        await api.post('/parts', formData);
      }
      setShowModal(false);
      loadParts();
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
    if (!confirm('确定要删除这个配件吗？')) return;
    try {
      await api.delete(`/parts/${id}`);
      loadParts();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };
  
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/parts/${selectedPart._id}/stock`, stockForm);
      setShowStockModal(false);
      setSelectedPart(null);
      setStockForm({ type: 'in', quantity: 0, remark: '' });
      loadParts();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };
  
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: '空调配件',
      brand: '',
      model: '',
      specification: '',
      unit: '个',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      location: '',
      status: 'active',
      warrantyMonths: 12,
      supplier: '',
      remark: ''
    });
  };
  
  const isLowStock = (item) => item.stock <= item.minStock;
  
  return (
    <AdminLayout title="配件管理">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
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
              <option value="active">在售</option>
              <option value="inactive">停用</option>
              <option value="discontinued">停产</option>
            </select>
            
            <input
              type="text"
              placeholder="搜索配件名称/型号"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              className="input"
              style={{ width: '200px' }}
            />
          </div>
          
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn btn-primary"
          >
            + 新增配件
          </button>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配件名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">品牌/型号</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">成本价</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">售价</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">库存</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                parts.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{item.brand || '-'}</p>
                      <p className="text-xs text-gray-500">{item.model || item.specification || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{item.costPrice?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">¥{item.salePrice?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${isLowStock(item) ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.stock} {item.unit}
                      </span>
                      {isLowStock(item) && (
                        <p className="text-xs text-red-500">库存预警</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : item.status === 'inactive'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'active' ? '在售' : item.status === 'inactive' ? '停用' : '停产'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelectedPart(item); setShowStockModal(true); }}
                        className="text-green-600 hover:text-green-800 text-sm mr-2"
                      >
                        入库
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm mr-2"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingItem ? '编辑配件' : '新增配件'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">配件名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">分类 *</label>
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
                  <label className="label">品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">规格</label>
                  <input
                    type="text"
                    value={formData.specification}
                    onChange={(e) => setFormData(prev => ({ ...prev, specification: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">单位</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="select"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">成本价(元) *</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">销售价(元) *</label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">库存数量</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">最低库存预警</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">存放位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">保修月数</label>
                  <input
                    type="number"
                    value={formData.warrantyMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyMonths: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">供应商</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
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
                    <option value="active">在售</option>
                    <option value="inactive">停用</option>
                    <option value="discontinued">停产</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="input"
                  rows="2"
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
      
      {showStockModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">库存调整 - {selectedPart.name}</h3>
              <p className="text-sm text-gray-500 mt-1">当前库存: {selectedPart.stock} {selectedPart.unit}</p>
            </div>
            
            <form onSubmit={handleStockUpdate} className="p-5 space-y-4">
              <div>
                <label className="label">操作类型</label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm(prev => ({ ...prev, type: e.target.value }))}
                  className="select"
                >
                  <option value="in">入库</option>
                  <option value="out">出库</option>
                  <option value="set">设置</option>
                </select>
              </div>
              
              <div>
                <label className="label">数量</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="label">备注</label>
                <input
                  type="text"
                  value={stockForm.remark}
                  onChange={(e) => setStockForm(prev => ({ ...prev, remark: e.target.value }))}
                  className="input"
                  placeholder="请输入备注"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowStockModal(false); setSelectedPart(null); }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
