import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';

const levelColors = {
  '初级': 'bg-gray-100 text-gray-700',
  '中级': 'bg-blue-100 text-blue-700',
  '高级': 'bg-purple-100 text-purple-700',
  '专家': 'bg-orange-100 text-orange-700'
};

const statusColors = {
  on_duty: 'bg-green-100 text-green-700',
  off_duty: 'bg-gray-100 text-gray-600',
  busy: 'bg-red-100 text-red-700',
  leave: 'bg-yellow-100 text-yellow-700'
};

const statusLabels = {
  on_duty: '在岗',
  off_duty: '休息',
  busy: '忙碌',
  leave: '请假'
};

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    level: '中级',
    skillCategories: [],
    baseSalary: 0,
    commissionRate: 15,
    serviceFee: 0,
    hourlyRate: 0,
    store: '',
    status: 'off_duty',
    workArea: '',
    remark: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    level: 'all',
    store: ''
  });
  
  const skillCategories = ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'];
  
  useEffect(() => {
    loadTechnicians();
  }, [pagination.page, filters]);
  
  const loadTechnicians = async () => {
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
      
      const result = await api.get('/technicians', params);
      if (result.success) {
        setTechnicians(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载师傅列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/technicians/${editingItem._id}`, formData);
      } else {
        await api.post('/technicians', formData);
      }
      setShowModal(false);
      loadTechnicians();
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
    if (!confirm('确定要删除这位师傅吗？')) return;
    try {
      await api.delete(`/technicians/${id}`);
      loadTechnicians();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };
  
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      phone: '',
      level: '中级',
      skillCategories: [],
      baseSalary: 0,
      commissionRate: 15,
      serviceFee: 0,
      hourlyRate: 0,
      store: '',
      status: 'off_duty',
      workArea: '',
      remark: ''
    });
  };
  
  const toggleSkill = (skill) => {
    setFormData(prev => {
      const skills = prev.skillCategories || [];
      if (skills.includes(skill)) {
        return { ...prev, skillCategories: skills.filter(s => s !== skill) };
      } else {
        return { ...prev, skillCategories: [...skills, skill] };
      }
    });
  };
  
  return (
    <AdminLayout title="师傅管理">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="select"
              style={{ width: '120px' }}
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="select"
              style={{ width: '120px' }}
            >
              <option value="all">全部级别</option>
              {Object.keys(levelColors).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="门店"
              value={filters.store}
              onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
              className="input"
              style={{ width: '150px' }}
            />
          </div>
          
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn btn-primary"
          >
            + 新增师傅
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
          ) : technicians.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">暂无数据</div>
          ) : (
            technicians.map((tech) => (
              <div key={tech._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {tech.name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">{tech.name}</h4>
                      <p className="text-sm text-gray-500">{tech.phone}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[tech.status]}`}>
                    {statusLabels[tech.status]}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">级别：</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${levelColors[tech.level]}`}>
                      {tech.level}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">评分：</span>
                    <span className="text-yellow-500">★ {tech.rating?.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">门店：</span>
                    <span className="text-gray-800">{tech.store || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">完成单量：</span>
                    <span className="text-gray-800">{tech.completedOrders}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">擅长技能</p>
                  <div className="flex flex-wrap gap-1">
                    {(tech.skillCategories || []).map(skill => (
                      <span key={skill} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    上门费：<span className="font-medium text-blue-600">¥{tech.serviceFee}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tech)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(tech._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {pagination.total > 0 && (
          <div className="flex items-center justify-between py-3">
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
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingItem ? '编辑师傅' : '新增师傅'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">手机号 *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">级别</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="select"
                  >
                    {Object.keys(levelColors).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="select"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">门店</label>
                  <input
                    type="text"
                    value={formData.store}
                    onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">服务区域</label>
                  <input
                    type="text"
                    value={formData.workArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, workArea: e.target.value }))}
                    className="input"
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
                  />
                </div>
                
                <div>
                  <label className="label">时薪(元/小时)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">基本工资(元)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="label">提成比例(%)</label>
                  <input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">擅长技能</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillCategories.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        (formData.skillCategories || []).includes(skill)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
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
    </AdminLayout>
  );
}
