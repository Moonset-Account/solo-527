import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

export default function Borrows() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    activityId: '',
    materialIds: [] as string[],
    expectedBorrowDate: '',
    expectedReturnDate: '',
    remarks: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, isAuthenticated, navigate]);

  useEffect(() => {
    if (token) {
      loadBorrows();
    }
  }, [token, filterStatus]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [acts, mats] = await Promise.all([
        api.activities.list(token),
        api.materials.list(token, { status: 'available' }),
      ]);
      setActivities(Array.isArray(acts) ? acts : []);
      setMaterials(Array.isArray(mats) ? mats : []);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const loadBorrows = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const data: any = await api.borrows.list(token, params);
      setBorrows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载借用申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      await api.borrows.create(token, formData);
      setShowCreateModal(false);
      setFormData({
        activityId: '',
        materialIds: [],
        expectedBorrowDate: '',
        expectedReturnDate: '',
        remarks: '',
      });
      loadBorrows();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      await api.borrows.approve(token, id);
      loadBorrows();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    const reason = prompt('请输入拒绝原因：');
    try {
      await api.borrows.reject(token, id, reason || undefined);
      loadBorrows();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleViewDetail = async (id: string) => {
    if (!token) return;
    try {
      const data = await api.borrows.get(token, id);
      setSelectedBorrow(data);
      setShowDetailModal(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleMaterialToggle = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materialIds: prev.materialIds.includes(materialId)
        ? prev.materialIds.filter(id => id !== materialId)
        : [...prev.materialIds, materialId]
    }));
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  const statusText: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成',
    cancelled: '已取消',
  };

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">借用管理</h1>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="completed">已完成</option>
            </select>
            {(user?.role === 'volunteer_leader' || user?.role === 'admin') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                + 新建申请
              </button>
            )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">活动名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">借用日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">归还日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {borrows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        暂无借用申请
                      </td>
                    </tr>
                  ) : (
                    borrows.map((borrow: any) => (
                      <tr key={borrow.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {borrow.activity_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {borrow.applicant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {borrow.expected_borrow_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {borrow.expected_return_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[borrow.status]}`}>
                            {statusText[borrow.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleViewDetail(borrow.id)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            详情
                          </button>
                          {borrow.status === 'pending' && (user?.role === 'warehouse_manager' || user?.role === 'admin') && (
                            <>
                              <button
                                onClick={() => handleApprove(borrow.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                批准
                              </button>
                              <button
                                onClick={() => handleReject(borrow.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">新建借用申请</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择活动</label>
                  <select
                    value={formData.activityId}
                    onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    <option value="">请选择活动</option>
                    {activities.map((act: any) => (
                      <option key={act.id} value={act.id}>{act.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预计借用日期</label>
                    <input
                      type="date"
                      value={formData.expectedBorrowDate}
                      onChange={(e) => setFormData({ ...formData, expectedBorrowDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预计归还日期</label>
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择物资</label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {materials.map((mat: any) => (
                      <label key={mat.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.materialIds.includes(mat.id)}
                          onChange={() => handleMaterialToggle(mat.id)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{mat.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{mat.qr_code}</span>
                        <span className="text-xs text-gray-500">{mat.category_name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">已选择 {formData.materialIds.length} 件物资</p>
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
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={formData.materialIds.length === 0}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    提交申请
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && selectedBorrow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">申请详情</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">活动名称</p>
                    <p className="font-medium">{selectedBorrow.activity_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">申请人</p>
                    <p className="font-medium">{selectedBorrow.applicant_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">预计借用日期</p>
                    <p className="font-medium">{selectedBorrow.expected_borrow_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">预计归还日期</p>
                    <p className="font-medium">{selectedBorrow.expected_return_date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">物资清单</p>
                  <div className="border rounded-lg divide-y">
                    {selectedBorrow.items?.map((item: any) => (
                      <div key={item.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.material_name}</p>
                          <p className="text-xs text-gray-500">{item.qr_code}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || 'bg-gray-100'}`}>
                          {statusText[item.status] || item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedBorrow.remarks && (
                  <div>
                    <p className="text-sm text-gray-500">备注</p>
                    <p>{selectedBorrow.remarks}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
