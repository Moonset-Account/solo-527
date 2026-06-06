import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

export default function Compensations() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [compensations, setCompensations] = useState<any[]>([]);
  const [manualEntries, setManualEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'compensations' | 'manual'>('compensations');
  const [showManualModal, setShowManualModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [manualForm, setManualForm] = useState({
    entryType: 'borrow' as 'borrow' | 'return' | 'material' | 'compensation',
    entityId: '',
    entryReason: '',
    entryDetails: '{}',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, isAuthenticated, navigate, filterStatus, activeTab]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeTab === 'compensations') {
        const data: any = await api.compensations.list(token, filterStatus || undefined);
        setCompensations(Array.isArray(data) ? data : []);
      } else {
        const data: any = await api.compensations.manualEntries(token);
        setManualEntries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompensation = async (id: string, action: 'paid' | 'waived') => {
    if (!token) return;
    const remarks = action === 'waived' ? prompt('请输入豁免原因：') ?? undefined : undefined;
    try {
      await api.compensations.handle(token, id, action, remarks);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      let entryDetails;
      try {
        entryDetails = JSON.parse(manualForm.entryDetails);
      } catch {
        entryDetails = {};
      }
      
      await api.compensations.createManualEntry(token, {
        ...manualForm,
        entryDetails,
      });
      setShowManualModal(false);
      setManualForm({
        entryType: 'borrow',
        entityId: '',
        entryReason: '',
        entryDetails: '{}',
      });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    waived: 'bg-blue-100 text-blue-800',
    processing: 'bg-orange-100 text-orange-800',
  };

  const statusText: Record<string, string> = {
    pending: '待处理',
    paid: '已赔付',
    waived: '已豁免',
    processing: '处理中',
  };

  const entryTypeText: Record<string, string> = {
    borrow: '借用补录',
    return: '归还补录',
    material: '物资补录',
    compensation: '赔付补录',
  };

  if (!isAuthenticated || (user?.role !== 'warehouse_manager' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">赔付管理</h1>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('compensations')}
                className={`px-4 py-2 rounded-md text-sm ${
                  activeTab === 'compensations' ? 'bg-white shadow text-primary-600' : 'text-gray-600'
                }`}
              >
                赔付单
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded-md text-sm ${
                  activeTab === 'manual' ? 'bg-white shadow text-primary-600' : 'text-gray-600'
                }`}
              >
                人工补录
              </button>
            </div>
            {activeTab === 'manual' && (
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                + 新建补录
              </button>
            )}
          </div>
        </div>

        {activeTab === 'compensations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="paid">已赔付</option>
              <option value="waived">已豁免</option>
            </select>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : activeTab === 'compensations' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">赔付金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {compensations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        暂无赔付记录
                      </td>
                    </tr>
                  ) : (
                    compensations.map((comp: any) => (
                      <tr key={comp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {comp.material_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {comp.applicant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ¥{comp.amount}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {comp.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[comp.status]}`}>
                            {statusText[comp.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(comp.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {comp.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleCompensation(comp.id, 'paid')}
                                className="text-green-600 hover:text-green-800"
                              >
                                确认收款
                              </button>
                              <button
                                onClick={() => handleCompensation(comp.id, 'waived')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                豁免
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">补录人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {manualEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        暂无补录记录
                      </td>
                    </tr>
                  ) : (
                    manualEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {entryTypeText[entry.entry_type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.entered_by_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {entry.entry_reason}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate font-mono">
                          {JSON.stringify(entry.entry_details).substring(0, 50)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showManualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">新建人工补录</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">补录类型</label>
                  <select
                    value={manualForm.entryType}
                    onChange={(e) => setManualForm({ ...manualForm, entryType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="borrow">借用补录</option>
                    <option value="return">归还补录</option>
                    <option value="material">物资补录</option>
                    <option value="compensation">赔付补录</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">关联ID（可选）</label>
                  <input
                    type="text"
                    value={manualForm.entityId}
                    onChange={(e) => setManualForm({ ...manualForm, entityId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">补录原因</label>
                  <textarea
                    value={manualForm.entryReason}
                    onChange={(e) => setManualForm({ ...manualForm, entryReason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">补录详情（JSON）</label>
                  <textarea
                    value={manualForm.entryDetails}
                    onChange={(e) => setManualForm({ ...manualForm, entryDetails: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                    rows={3}
                    placeholder='{"key": "value"}'
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    提交
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
