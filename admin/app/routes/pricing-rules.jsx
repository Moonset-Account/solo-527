import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';

const ruleTypeLabels = {
  time_slot: '时段加价',
  difficulty: '难度加价',
  distance: '距离加价',
  urgent: '加急加价',
  quantity: '数量加价',
  custom: '自定义加价'
};

const priceTypeLabels = {
  fixed: '固定金额',
  percentage: '百分比',
  tiered: '阶梯式'
};

export default function PricingRules() {
  const [rules, setRules] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'time_slot',
    description: '',
    priceType: 'fixed',
    value: 0,
    priority: 0,
    status: 'active'
  });
  const [filters, setFilters] = useState({
    ruleType: 'all',
    status: 'active'
  });
  
  useEffect(() => {
    loadRules();
  }, [pagination.page, filters]);
  
  const loadRules = async () => {
    setLoading(true);
    try {
      const result = await api.get('/pricing-rules', {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      });
      if (result.success) {
        setRules(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载加价规则失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/pricing-rules/${editingItem._id}`, formData);
      } else {
        await api.post('/pricing-rules', formData);
      }
      setShowModal(false);
      loadRules();
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
    if (!confirm('确定要删除这条加价规则吗？')) return;
    try {
      await api.delete(`/pricing-rules/${id}`);
      loadRules();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };
  
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      ruleType: 'time_slot',
      description: '',
      priceType: 'fixed',
      value: 0,
      priority: 0,
      status: 'active'
    });
  };
  
  return (
    <AdminLayout title="加价规则">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <select
              value={filters.ruleType}
              onChange={(e) => setFilters(prev => ({ ...prev, ruleType: e.target.value }))}
              className="select"
              style={{ width: '150px' }}
            >
              <option value="all">全部类型</option>
              {Object.entries(ruleTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
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
            + 新增规则
          </button>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">规则名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">计价方式</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">加价金额/比例</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">优先级</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                rules.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {ruleTypeLabels[item.ruleType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{priceTypeLabels[item.priceType]}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {item.priceType === 'percentage' ? `${item.value}%` : `¥${item.value?.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.priority}</td>
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
                {editingItem ? '编辑加价规则' : '新增加价规则'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">规则名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">规则类型 *</label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, ruleType: e.target.value }))}
                    className="select"
                  >
                    {Object.entries(ruleTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">计价方式 *</label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value }))}
                    className="select"
                  >
                    <option value="fixed">固定金额</option>
                    <option value="percentage">百分比</option>
                    <option value="tiered">阶梯式</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">
                    {formData.priceType === 'percentage' ? '加价比例(%)' : '加价金额(元)'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="label">优先级</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
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
                <label className="label">规则描述</label>
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
